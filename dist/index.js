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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
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
     *
     * @return {Date}
     */
    function getMonthEnd(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /**
     * Get the first day of the month.
     *
     * @param {Date} date
     *
     * @return {Date}
     */
    function getMonthStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Get the last day of the week.
     *
     * @param {Date} date
     *
     * @return {Date}
     */
    function getWeekEnd(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
    }

    /**
     * Return the week index of a date.
     *
     * @param {Date} date
     *
     * @return {number}
     */
    function getWeekIndex(date) {
        const firstWeekday = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        const offsetDate = date.getDate() + firstWeekday - 1;

        return Math.floor(offsetDate / 7);
    }

    /**
     * Get the first day of the week.
     *
     * @param {Date} date
     *
     * @return {Date}
     */
    function getWeekStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    }

    /**
     * Normalize to a javascript Date object.
     *
     * @param {Date|number|string} value
     *
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
     * Stringify a date.
     *
     * @param {Date} date
     * 
     * @return {string}
     */
    function stringifyDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    /**
     * Divide a calendar into months.
     *
     * @param {Object}              options
     * @param {boolean}             options.allowOverflow
     * @param {Array<Object>}       options.calendar
     * @param {Date|string|number}  options.endDate
     * @param {Date|string|number}  options.startDate
     *
     * @return {Array<Array<Object>>} 
     */
    function chunkMonths({ allowOverflow, calendar, endDate, startDate }) {
        let prevMonth = -1;

        startDate = normalizeDate(startDate);
        endDate = normalizeDate(endDate);

        return calendar.reduce((acc, day) => {
            const currentMonth = day.date.getMonth();

            if (prevMonth !== currentMonth) {
                acc.push([]);
                prevMonth = currentMonth;
            }

            if (
                allowOverflow || (
                    (!startDate || day.date >= startDate) &&
                    (!endDate || day.date <= endDate)
                )
            ) {
                acc[acc.length - 1].push(day);
            }

            return acc;
        }, []);
    }

    /**
     * Divide a calendar into weeks.
     *
     * @param {Object}              options
     * @param {boolean}             options.allowOverflow
     * @param {Array<Object>}       options.calendar
     * @param {Date|string|number}  options.endDate
     * @param {Date|string|number}  options.startDate
     *
     * @return {Array<Array<Object>>} 
     */
    function chunkWeeks({ allowOverflow, calendar, endDate, startDate }) {
        startDate = normalizeDate(startDate);
        endDate = normalizeDate(endDate);

        return calendar.reduce((acc, day, index) => {
            if (index % 7 === 0) {
                acc.push([]);
            }

            if (
                allowOverflow || (
                    (!startDate || day.date >= startDate) &&
                    (!endDate || day.date <= endDate)
                )
            ) {
                acc[acc.length - 1].push(day);
            }

            return acc;
        }, []);
    }

    /**
     * Determine the first day rendered on the heatmap.
     *
     * @param {Object}              props
     * @param {Array<string>}       props.colors
     * @param {Array<Object>}       props.data
     * @param {string}              props.emptyColor
     * @param {Date|number|string}  props.endDate
     * @param {Date|number|string}  props.startDate
     * @param {string}              props.view
     *
     * @return {Date}
     */
    function getCalendar({ colors, data, emptyColor, endDate, startDate, view }) {
        startDate = startDate ? normalizeDate(startDate) : new Date();
        endDate = endDate ? normalizeDate(endDate) : new Date();

        if (view === 'monthly') {
            startDate = getMonthStart(startDate);
            endDate = getMonthEnd(endDate);
        } else {
            startDate = getWeekStart(startDate);
            endDate = getWeekEnd(endDate);
        }

        let max = 0;
        const startDayOfMonth = startDate.getDate();
        const totalDays = Math.floor((endDate - startDate) / 86400000) + 1; // 86400000 = 1000 * 60 * 60 * 24

        return new Array(totalDays)
            .fill()
            .map((x, offset) => {
                const day = getDay({ data, offset, startDate, startDayOfMonth });

                if (day.value > max) {
                    max = day.value;
                }

                return day;
            })
            .map(({ date, value }) => {
                let color = getColor({ colors, max, value }) || emptyColor;

                return { color, date, value }
            });
    }

    /**
     * Determine what color a value should be.
     *
     * @param {options}         options
     * @param {Array<string>}   options.colors
     * @param {number}          options.max
     * @param {number}          options.value
     *
     * @return {string|null}
     */
    function getColor({ colors, max, value }) {
        if (colors.length && value) {
            let color = colors[0];

            const intencity = value / max;

            for (let i = 1; i < colors.length; i++) {
                if (intencity < i / colors.length) {
                    return color;
                }
                
                color = colors[i];
            }

            return colors[colors.length - 1];
        }

        return null;
    }

    /**
     * Aggregate the value of each day.
     *
     * @param {Object}          options
     * @param {Array<Object>}   options.data
     * @param {number}          options.offset
     * @param {number}          options.startDayOfMonth
     * @param {Date}            options.startDate
     *
     * @return {Object}
     */
    function getDay({ data, offset, startDate, startDayOfMonth }) {
        const date = new Date(startDate);
        date.setDate(startDayOfMonth + offset);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const value = data.reduce((acc, obj) => {
            const datapoint = normalizeDate(obj.date);

            return datapoint >= date && datapoint < nextDate ? acc + obj.value : acc;
        }, 0);

        return { date, value };
    }

    /* src/views/Month.svelte generated by Svelte v3.19.1 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (2:4) {#each days as day, index}
    function create_each_block(ctx) {
    	let rect;
    	let rect_data_date_value;
    	let rect_data_value_value;
    	let rect_fill_value;
    	let rect_x_value;
    	let rect_y_value;

    	return {
    		c() {
    			rect = svg_element("rect");
    			attr(rect, "data-date", rect_data_date_value = /*day*/ ctx[7].date);
    			attr(rect, "data-value", rect_data_value_value = /*day*/ ctx[7].value);
    			attr(rect, "fill", rect_fill_value = /*day*/ ctx[7].color);
    			attr(rect, "height", /*cellSize*/ ctx[1]);
    			attr(rect, "width", /*cellSize*/ ctx[1]);
    			attr(rect, "x", rect_x_value = /*day*/ ctx[7].date.getDay() * /*cellRect*/ ctx[0]);
    			attr(rect, "y", rect_y_value = getWeekIndex(/*day*/ ctx[7].date) * /*cellRect*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, rect, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*days*/ 4 && rect_data_date_value !== (rect_data_date_value = /*day*/ ctx[7].date)) {
    				attr(rect, "data-date", rect_data_date_value);
    			}

    			if (dirty & /*days*/ 4 && rect_data_value_value !== (rect_data_value_value = /*day*/ ctx[7].value)) {
    				attr(rect, "data-value", rect_data_value_value);
    			}

    			if (dirty & /*days*/ 4 && rect_fill_value !== (rect_fill_value = /*day*/ ctx[7].color)) {
    				attr(rect, "fill", rect_fill_value);
    			}

    			if (dirty & /*cellSize*/ 2) {
    				attr(rect, "height", /*cellSize*/ ctx[1]);
    			}

    			if (dirty & /*cellSize*/ 2) {
    				attr(rect, "width", /*cellSize*/ ctx[1]);
    			}

    			if (dirty & /*days, cellRect*/ 5 && rect_x_value !== (rect_x_value = /*day*/ ctx[7].date.getDay() * /*cellRect*/ ctx[0])) {
    				attr(rect, "x", rect_x_value);
    			}

    			if (dirty & /*days, cellRect*/ 5 && rect_y_value !== (rect_y_value = getWeekIndex(/*day*/ ctx[7].date) * /*cellRect*/ ctx[0])) {
    				attr(rect, "y", rect_y_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(rect);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let g;
    	let g_transform_value;
    	let each_value = /*days*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(g, "transform", g_transform_value = `translate(${/*translation*/ ctx[3]}, 0)`);
    		},
    		m(target, anchor) {
    			insert(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*days, cellSize, cellRect, getWeekIndex*/ 7) {
    				each_value = /*days*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*translation*/ 8 && g_transform_value !== (g_transform_value = `translate(${/*translation*/ ctx[3]}, 0)`)) {
    				attr(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { cellGap } = $$props;
    	let { cellRect } = $$props;
    	let { cellSize } = $$props;
    	let { days } = $$props;
    	let { index } = $$props;
    	let { monthGap } = $$props;

    	$$self.$set = $$props => {
    		if ("cellGap" in $$props) $$invalidate(4, cellGap = $$props.cellGap);
    		if ("cellRect" in $$props) $$invalidate(0, cellRect = $$props.cellRect);
    		if ("cellSize" in $$props) $$invalidate(1, cellSize = $$props.cellSize);
    		if ("days" in $$props) $$invalidate(2, days = $$props.days);
    		if ("index" in $$props) $$invalidate(6, index = $$props.index);
    		if ("monthGap" in $$props) $$invalidate(5, monthGap = $$props.monthGap);
    	};

    	let translation;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cellRect, cellGap, monthGap, index*/ 113) {
    			 $$invalidate(3, translation = (7 * cellRect - cellGap + monthGap) * index);
    		}
    	};

    	return [cellRect, cellSize, days, translation, cellGap, monthGap, index];
    }

    class Month extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			cellGap: 4,
    			cellRect: 0,
    			cellSize: 1,
    			days: 2,
    			index: 6,
    			monthGap: 5
    		});
    	}
    }

    /* src/views/Week.svelte generated by Svelte v3.19.1 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (2:4) {#each days as day, index}
    function create_each_block$1(ctx) {
    	let rect;
    	let rect_data_date_value;
    	let rect_data_value_value;
    	let rect_fill_value;
    	let rect_y_value;

    	return {
    		c() {
    			rect = svg_element("rect");
    			attr(rect, "data-date", rect_data_date_value = stringifyDate(/*day*/ ctx[5].date));
    			attr(rect, "data-value", rect_data_value_value = /*day*/ ctx[5].value);
    			attr(rect, "fill", rect_fill_value = /*day*/ ctx[5].color);
    			attr(rect, "height", /*cellSize*/ ctx[1]);
    			attr(rect, "width", /*cellSize*/ ctx[1]);
    			attr(rect, "y", rect_y_value = /*index*/ ctx[3] * /*cellRect*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, rect, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*days*/ 4 && rect_data_date_value !== (rect_data_date_value = stringifyDate(/*day*/ ctx[5].date))) {
    				attr(rect, "data-date", rect_data_date_value);
    			}

    			if (dirty & /*days*/ 4 && rect_data_value_value !== (rect_data_value_value = /*day*/ ctx[5].value)) {
    				attr(rect, "data-value", rect_data_value_value);
    			}

    			if (dirty & /*days*/ 4 && rect_fill_value !== (rect_fill_value = /*day*/ ctx[5].color)) {
    				attr(rect, "fill", rect_fill_value);
    			}

    			if (dirty & /*cellSize*/ 2) {
    				attr(rect, "height", /*cellSize*/ ctx[1]);
    			}

    			if (dirty & /*cellSize*/ 2) {
    				attr(rect, "width", /*cellSize*/ ctx[1]);
    			}

    			if (dirty & /*cellRect*/ 1 && rect_y_value !== (rect_y_value = /*index*/ ctx[3] * /*cellRect*/ ctx[0])) {
    				attr(rect, "y", rect_y_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(rect);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let g;
    	let g_transform_value;
    	let each_value = /*days*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(g, "transform", g_transform_value = `translate(${/*translation*/ ctx[4]}, 0)`);
    		},
    		m(target, anchor) {
    			insert(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*stringifyDate, days, cellSize, cellRect*/ 7) {
    				each_value = /*days*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*translation*/ 16 && g_transform_value !== (g_transform_value = `translate(${/*translation*/ ctx[4]}, 0)`)) {
    				attr(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { cellRect } = $$props;
    	let { cellSize } = $$props;
    	let { days } = $$props;
    	let { index } = $$props;

    	$$self.$set = $$props => {
    		if ("cellRect" in $$props) $$invalidate(0, cellRect = $$props.cellRect);
    		if ("cellSize" in $$props) $$invalidate(1, cellSize = $$props.cellSize);
    		if ("days" in $$props) $$invalidate(2, days = $$props.days);
    		if ("index" in $$props) $$invalidate(3, index = $$props.index);
    	};

    	let translation;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cellRect, index*/ 9) {
    			 $$invalidate(4, translation = cellRect * index);
    		}
    	};

    	return [cellRect, cellSize, days, index, translation];
    }

    class Week extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			cellRect: 0,
    			cellSize: 1,
    			days: 2,
    			index: 3
    		});
    	}
    }

    /* src/Heatmap.svelte generated by Svelte v3.19.1 */

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (13:4) {:else}
    function create_else_block(ctx) {
    	let g;
    	let g_transform_value;
    	let current;
    	let if_block = /*dayLabelWidth*/ ctx[2] > 0 && create_if_block_2(ctx);
    	let each_value_1 = /*chunks*/ ctx[12];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			if (if_block) if_block.c();
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(g, "transform", g_transform_value = `translate(${/*dayLabelWidth*/ ctx[2]})`);
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*dayLabelWidth*/ ctx[2] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(g.parentNode, g);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*fontColor, fontFamily, fontSize, cellRect, monthLabels, chunks, monthLabelHeight, isNewMonth, cellSize*/ 72562) {
    				each_value_1 = /*chunks*/ ctx[12];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(g, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*dayLabelWidth*/ 4 && g_transform_value !== (g_transform_value = `translate(${/*dayLabelWidth*/ ctx[2]})`)) {
    				attr(g, "transform", g_transform_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(g);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (2:4) {#if view === 'monthly'}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*chunks*/ ctx[12];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*cellGap, cellRect, cellSize, monthGap, chunks*/ 6275) {
    				each_value = /*chunks*/ ctx[12];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (14:8) {#if dayLabelWidth > 0}
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*dayLabels*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*fontColor, fontFamily, fontSize, dayLabelPosition, dayLabels*/ 32888) {
    				each_value_2 = /*dayLabels*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (15:12) {#each dayLabels as label, index}
    function create_each_block_2(ctx) {
    	let text_1;
    	let t_value = /*label*/ ctx[29] + "";
    	let t;
    	let text_1_y_value;

    	return {
    		c() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr(text_1, "alignment-baseline", "middle");
    			attr(text_1, "fill", /*fontColor*/ ctx[4]);
    			attr(text_1, "font-family", /*fontFamily*/ ctx[5]);
    			attr(text_1, "font-size", /*fontSize*/ ctx[6]);
    			attr(text_1, "x", "0");
    			attr(text_1, "y", text_1_y_value = /*dayLabelPosition*/ ctx[15](/*index*/ ctx[27]));
    		},
    		m(target, anchor) {
    			insert(target, text_1, anchor);
    			append(text_1, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*dayLabels*/ 8 && t_value !== (t_value = /*label*/ ctx[29] + "")) set_data(t, t_value);

    			if (dirty & /*fontColor*/ 16) {
    				attr(text_1, "fill", /*fontColor*/ ctx[4]);
    			}

    			if (dirty & /*fontFamily*/ 32) {
    				attr(text_1, "font-family", /*fontFamily*/ ctx[5]);
    			}

    			if (dirty & /*fontSize*/ 64) {
    				attr(text_1, "font-size", /*fontSize*/ ctx[6]);
    			}

    			if (dirty & /*dayLabelPosition*/ 32768 && text_1_y_value !== (text_1_y_value = /*dayLabelPosition*/ ctx[15](/*index*/ ctx[27]))) {
    				attr(text_1, "y", text_1_y_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(text_1);
    		}
    	};
    }

    // (37:16) {#if monthLabelHeight > 0 && isNewMonth(chunks, index)}
    function create_if_block_1(ctx) {
    	let text_1;
    	let t_value = /*monthLabels*/ ctx[9][/*chunk*/ ctx[25][0].date.getMonth()] + "";
    	let t;
    	let text_1_x_value;

    	return {
    		c() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr(text_1, "alignment-baseline", "hanging");
    			attr(text_1, "fill", /*fontColor*/ ctx[4]);
    			attr(text_1, "font-family", /*fontFamily*/ ctx[5]);
    			attr(text_1, "font-size", /*fontSize*/ ctx[6]);
    			attr(text_1, "x", text_1_x_value = /*cellRect*/ ctx[11] * /*index*/ ctx[27]);
    		},
    		m(target, anchor) {
    			insert(target, text_1, anchor);
    			append(text_1, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*monthLabels, chunks*/ 4608 && t_value !== (t_value = /*monthLabels*/ ctx[9][/*chunk*/ ctx[25][0].date.getMonth()] + "")) set_data(t, t_value);

    			if (dirty & /*fontColor*/ 16) {
    				attr(text_1, "fill", /*fontColor*/ ctx[4]);
    			}

    			if (dirty & /*fontFamily*/ 32) {
    				attr(text_1, "font-family", /*fontFamily*/ ctx[5]);
    			}

    			if (dirty & /*fontSize*/ 64) {
    				attr(text_1, "font-size", /*fontSize*/ ctx[6]);
    			}

    			if (dirty & /*cellRect*/ 2048 && text_1_x_value !== (text_1_x_value = /*cellRect*/ ctx[11] * /*index*/ ctx[27])) {
    				attr(text_1, "x", text_1_x_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(text_1);
    		}
    	};
    }

    // (28:12) {#each chunks as chunk, index}
    function create_each_block_1(ctx) {
    	let g;
    	let g_transform_value;
    	let show_if = /*monthLabelHeight*/ ctx[8] > 0 && /*isNewMonth*/ ctx[16](/*chunks*/ ctx[12], /*index*/ ctx[27]);
    	let if_block_anchor;
    	let current;

    	const week = new Week({
    			props: {
    				cellRect: /*cellRect*/ ctx[11],
    				cellSize: /*cellSize*/ ctx[1],
    				days: /*chunk*/ ctx[25],
    				index: /*index*/ ctx[27]
    			}
    		});

    	let if_block = show_if && create_if_block_1(ctx);

    	return {
    		c() {
    			g = svg_element("g");
    			create_component(week.$$.fragment);
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(g, "transform", g_transform_value = `translate(0, ${/*monthLabelHeight*/ ctx[8]})`);
    		},
    		m(target, anchor) {
    			insert(target, g, anchor);
    			mount_component(week, g, null);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const week_changes = {};
    			if (dirty & /*cellRect*/ 2048) week_changes.cellRect = /*cellRect*/ ctx[11];
    			if (dirty & /*cellSize*/ 2) week_changes.cellSize = /*cellSize*/ ctx[1];
    			if (dirty & /*chunks*/ 4096) week_changes.days = /*chunk*/ ctx[25];
    			week.$set(week_changes);

    			if (!current || dirty & /*monthLabelHeight*/ 256 && g_transform_value !== (g_transform_value = `translate(0, ${/*monthLabelHeight*/ ctx[8]})`)) {
    				attr(g, "transform", g_transform_value);
    			}

    			if (dirty & /*monthLabelHeight, chunks*/ 4352) show_if = /*monthLabelHeight*/ ctx[8] > 0 && /*isNewMonth*/ ctx[16](/*chunks*/ ctx[12], /*index*/ ctx[27]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(week.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(week.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(g);
    			destroy_component(week);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (3:8) {#each chunks as chunk, index}
    function create_each_block$2(ctx) {
    	let current;

    	const month = new Month({
    			props: {
    				cellGap: /*cellGap*/ ctx[0],
    				cellRect: /*cellRect*/ ctx[11],
    				cellSize: /*cellSize*/ ctx[1],
    				monthGap: /*monthGap*/ ctx[7],
    				days: /*chunk*/ ctx[25],
    				index: /*index*/ ctx[27]
    			}
    		});

    	return {
    		c() {
    			create_component(month.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(month, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const month_changes = {};
    			if (dirty & /*cellGap*/ 1) month_changes.cellGap = /*cellGap*/ ctx[0];
    			if (dirty & /*cellRect*/ 2048) month_changes.cellRect = /*cellRect*/ ctx[11];
    			if (dirty & /*cellSize*/ 2) month_changes.cellSize = /*cellSize*/ ctx[1];
    			if (dirty & /*monthGap*/ 128) month_changes.monthGap = /*monthGap*/ ctx[7];
    			if (dirty & /*chunks*/ 4096) month_changes.days = /*chunk*/ ctx[25];
    			month.$set(month_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(month.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(month.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(month, detaching);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let svg;
    	let current_block_type_index;
    	let if_block;
    	let svg_viewBox_value;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*view*/ ctx[10] === "monthly") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			svg = svg_element("svg");
    			if_block.c();
    			attr(svg, "viewBox", svg_viewBox_value = `0 0 ${/*width*/ ctx[14]} ${/*height*/ ctx[13]}`);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			if_blocks[current_block_type_index].m(svg, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(svg, null);
    			}

    			if (!current || dirty & /*width, height*/ 24576 && svg_viewBox_value !== (svg_viewBox_value = `0 0 ${/*width*/ ctx[14]} ${/*height*/ ctx[13]}`)) {
    				attr(svg, "viewBox", svg_viewBox_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { allowOverflow = false } = $$props;
    	let { cellGap = 2 } = $$props;
    	let { cellSize = 10 } = $$props;
    	let { colors = ["#c6e48b", "#7bc96f", "#239a3b", "#196127"] } = $$props;
    	let { data = [] } = $$props;
    	let { dayLabelWidth = 20 } = $$props;
    	let { dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""] } = $$props;
    	let { emptyColor = "#ebedf0" } = $$props;
    	let { endDate = null } = $$props;
    	let { fontColor = "#333" } = $$props;
    	let { fontFamily = "sans-serif" } = $$props;
    	let { fontSize = 8 } = $$props;
    	let { monthGap = 2 } = $$props;
    	let { monthLabelHeight = 12 } = $$props;

    	let { monthLabels = [
    		"Jan",
    		"Feb",
    		"Mar",
    		"Apr",
    		"May",
    		"Jun",
    		"Jul",
    		"Aug",
    		"Sep",
    		"Oct",
    		"Nov",
    		"Dec"
    	] } = $$props;

    	let { startDate = null } = $$props;
    	let { view = "weekly" } = $$props;

    	const isNewMonth = (chunks, index) => {
    		const chunk = chunks[index];
    		const prevChunk = chunks[index - 1];
    		return prevChunk && prevChunk.length && chunk.length && chunk[0].date.getMonth() > prevChunk[0].date.getMonth();
    	};

    	$$self.$set = $$props => {
    		if ("allowOverflow" in $$props) $$invalidate(17, allowOverflow = $$props.allowOverflow);
    		if ("cellGap" in $$props) $$invalidate(0, cellGap = $$props.cellGap);
    		if ("cellSize" in $$props) $$invalidate(1, cellSize = $$props.cellSize);
    		if ("colors" in $$props) $$invalidate(18, colors = $$props.colors);
    		if ("data" in $$props) $$invalidate(19, data = $$props.data);
    		if ("dayLabelWidth" in $$props) $$invalidate(2, dayLabelWidth = $$props.dayLabelWidth);
    		if ("dayLabels" in $$props) $$invalidate(3, dayLabels = $$props.dayLabels);
    		if ("emptyColor" in $$props) $$invalidate(20, emptyColor = $$props.emptyColor);
    		if ("endDate" in $$props) $$invalidate(21, endDate = $$props.endDate);
    		if ("fontColor" in $$props) $$invalidate(4, fontColor = $$props.fontColor);
    		if ("fontFamily" in $$props) $$invalidate(5, fontFamily = $$props.fontFamily);
    		if ("fontSize" in $$props) $$invalidate(6, fontSize = $$props.fontSize);
    		if ("monthGap" in $$props) $$invalidate(7, monthGap = $$props.monthGap);
    		if ("monthLabelHeight" in $$props) $$invalidate(8, monthLabelHeight = $$props.monthLabelHeight);
    		if ("monthLabels" in $$props) $$invalidate(9, monthLabels = $$props.monthLabels);
    		if ("startDate" in $$props) $$invalidate(22, startDate = $$props.startDate);
    		if ("view" in $$props) $$invalidate(10, view = $$props.view);
    	};

    	let cellRect;
    	let calendar;
    	let chunks;
    	let weekRect;
    	let height;
    	let width;
    	let dayLabelPosition;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cellSize, cellGap*/ 3) {
    			 $$invalidate(11, cellRect = cellSize + cellGap);
    		}

    		if ($$self.$$.dirty & /*allowOverflow, colors, data, emptyColor, endDate, startDate, view*/ 8258560) {
    			 $$invalidate(23, calendar = getCalendar({
    				allowOverflow,
    				colors,
    				data,
    				emptyColor,
    				endDate,
    				startDate,
    				view
    			}));
    		}

    		if ($$self.$$.dirty & /*view, allowOverflow, calendar, endDate, startDate*/ 14812160) {
    			 $$invalidate(12, chunks = view === "monthly"
    			? chunkMonths({
    					allowOverflow,
    					calendar,
    					endDate,
    					startDate
    				})
    			: chunkWeeks({
    					allowOverflow,
    					calendar,
    					endDate,
    					startDate
    				}));
    		}

    		if ($$self.$$.dirty & /*cellRect, cellGap*/ 2049) {
    			 $$invalidate(24, weekRect = 7 * cellRect - cellGap);
    		}

    		if ($$self.$$.dirty & /*view, cellRect, cellGap, monthLabelHeight, weekRect*/ 16780545) {
    			 $$invalidate(13, height = view === "monthly"
    			? 6 * cellRect - cellGap + monthLabelHeight
    			: weekRect + monthLabelHeight); // <- max of 6 rows in monthly view
    		}

    		if ($$self.$$.dirty & /*view, weekRect, monthGap, chunks, dayLabelWidth, cellRect, cellGap*/ 16784517) {
    			 $$invalidate(14, width = view === "monthly"
    			? (weekRect + monthGap) * chunks.length - monthGap + dayLabelWidth
    			: cellRect * chunks.length - cellGap + dayLabelWidth);
    		}

    		if ($$self.$$.dirty & /*cellRect, monthLabelHeight*/ 2304) {
    			 $$invalidate(15, dayLabelPosition = index => {
    				return cellRect * index + cellRect / 2 + monthLabelHeight;
    			});
    		}
    	};

    	return [
    		cellGap,
    		cellSize,
    		dayLabelWidth,
    		dayLabels,
    		fontColor,
    		fontFamily,
    		fontSize,
    		monthGap,
    		monthLabelHeight,
    		monthLabels,
    		view,
    		cellRect,
    		chunks,
    		height,
    		width,
    		dayLabelPosition,
    		isNewMonth,
    		allowOverflow,
    		colors,
    		data,
    		emptyColor,
    		endDate,
    		startDate
    	];
    }

    class Heatmap extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			allowOverflow: 17,
    			cellGap: 0,
    			cellSize: 1,
    			colors: 18,
    			data: 19,
    			dayLabelWidth: 2,
    			dayLabels: 3,
    			emptyColor: 20,
    			endDate: 21,
    			fontColor: 4,
    			fontFamily: 5,
    			fontSize: 6,
    			monthGap: 7,
    			monthLabelHeight: 8,
    			monthLabels: 9,
    			startDate: 22,
    			view: 10
    		});
    	}
    }

    return Heatmap;

})));
