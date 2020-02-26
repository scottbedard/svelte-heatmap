(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.Heatmap = factory());
}(this, (function () { 'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    /**
     * Get the last day of the month.
     *
     * @param {Date} date
     * @return {Date}
     */
    function getMonthEnd(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /**
     * Get the first day of the month.
     *
     * @param {Date} date
     * @return {Date}
     */
    function getMonthStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Get the last day of the week.
     *
     * @param {Date} date
     * @return {Date}
     */
    function getWeekEnd(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
    }

    /**
     * Get the first day of the week.
     *
     * @param {Date} date
     * @return {Date}
     */
    function getWeekStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    }

    /**
     * Normalize to a javascript Date object.
     *
     * @param {Date|number|string} value
     * @return {Date}
     */
    function normalizeDate(value) {
        if (value instanceof Date) {
            return value;
        }

        if (['number', 'string'].includes(typeof value)) {
            return new Date(value);
        }

        throw new Error('Invalid date value');
    }

    /**
     * Determine the first day rendered on the heatmap.
     *
     * @param {Object}              props
     * @param {Array<Object>}       props.data
     * @param {Date|number|string}  props.endDate
     * @param {Date|number|string}  props.startDate
     * @param {string}              props.view
     *
     * @return {Date}
     */
    function getCalendar({ data, endDate, startDate, view }) {
        startDate = startDate ? normalizeDate(startDate) : new Date();
        endDate = endDate ? normalizeDate(endDate) : new Date();

        if (view === 'monthly') {
            startDate = getMonthStart(startDate);
            endDate = getMonthEnd(endDate);
        } else {
            startDate = getWeekStart(startDate);
            endDate = getWeekEnd(endDate);
        }

        const days = Math.floor((endDate - startDate) / 86400000) + 1; // 86400000 = 1000 * 60 * 60 * 24
        const startDateOfMonth = startDate.getDate();

        return new Array(days).fill().map((x, i) => {
            const date = new Date(startDate);
            date.setDate(startDateOfMonth + i);

            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const value = data.reduce((acc, obj) => {
                const datapoint = normalizeDate(obj.date);

                return datapoint >= date && datapoint < nextDate ? acc + obj.value : acc;
            }, 0);

            return { date, value };
        });
    }

    /* src/Heatmap.svelte generated by Svelte v3.19.1 */

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let pre;
    	let t2_value = JSON.stringify(/*calendar*/ ctx[0], null, 4) + "";
    	let t2;

    	return {
    		c() {
    			h1 = element("h1");
    			h1.textContent = "Hello";
    			t1 = space();
    			pre = element("pre");
    			t2 = text(t2_value);
    		},
    		m(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, pre, anchor);
    			append(pre, t2);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*calendar*/ 1 && t2_value !== (t2_value = JSON.stringify(/*calendar*/ ctx[0], null, 4) + "")) set_data(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(h1);
    			if (detaching) detach(t1);
    			if (detaching) detach(pre);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { colors = ["#c6e48b", "#7bc96f", "#239a3b", "#196127"] } = $$props;
    	let { data = [] } = $$props;
    	let { emptyColor = "#ebedf0" } = $$props;
    	let { endDate = null } = $$props;
    	let { startDate = null } = $$props;
    	let { view = "yearly" } = $$props;

    	$$self.$set = $$props => {
    		if ("colors" in $$props) $$invalidate(1, colors = $$props.colors);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("emptyColor" in $$props) $$invalidate(3, emptyColor = $$props.emptyColor);
    		if ("endDate" in $$props) $$invalidate(4, endDate = $$props.endDate);
    		if ("startDate" in $$props) $$invalidate(5, startDate = $$props.startDate);
    		if ("view" in $$props) $$invalidate(6, view = $$props.view);
    	};

    	let calendar;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, endDate, startDate, view*/ 116) {
    			 $$invalidate(0, calendar = getCalendar({ data, endDate, startDate, view }));
    		}
    	};

    	return [calendar, colors, data, emptyColor, endDate, startDate, view];
    }

    class Heatmap extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			colors: 1,
    			data: 2,
    			emptyColor: 3,
    			endDate: 4,
    			startDate: 5,
    			view: 6
    		});
    	}
    }

    return Heatmap;

})));
