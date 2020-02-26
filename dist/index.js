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
    function element(name) {
        return document.createElement(name);
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
     * Divide an array of days into weekly / monthly chunks.
     *
     * @param {Object}          options
     * @param {Array<Object>}   options.days
     * @param {string}          options.view
     *
     * @return {Array<Array<Object>>} 
     */
    function chunkCalendar({ days, view }) {
        // monthly
        if (view === 'monthly') {
            let prevMonth = -1;

            return days.reduce((acc, day) => {
                const currentMonth = day.date.getMonth();

                if (prevMonth !== currentMonth) {
                    acc.push([]);
                    prevMonth = currentMonth;
                }

                acc[acc.length - 1].push(day);

                return acc;
            }, []);
        }

        // weekly
        return days.reduce((acc, day, index) => {
            if (index % 7 === 0) {
                acc.push([]);
            }

            acc[acc.length - 1].push(day);

            return acc;
        }, []);
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
        const startDayOfMonth = startDate.getDate();

        return new Array(days)
            .fill()
            .map((x, offset) => getCalendarValue({
                data,
                offset,
                startDate,
                startDayOfMonth,
            }));
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
    function getCalendarValue({ data, offset, startDate, startDayOfMonth }) {
        const date = new Date(startDate);
        date.setDate(startDayOfMonth + offset);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const value = data.reduce((acc, obj) => {
            const datapoint = normalizeDate(obj.date);

            return datapoint >= date && datapoint < nextDate
                ? acc + obj.value
                : acc;
        }, 0);

        return { date, value };
    }

    /* src/views/Month.svelte generated by Svelte v3.19.1 */

    function create_fragment(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Hello from a monthly view";
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    class Month extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment, safe_not_equal, {});
    	}
    }

    /* src/views/Week.svelte generated by Svelte v3.19.1 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[1] = i;
    	return child_ctx;
    }

    // (2:4) {#each days as day, index}
    function create_each_block(ctx) {
    	let rect;
    	let rect_y_value;

    	return {
    		c() {
    			rect = svg_element("rect");
    			attr(rect, "fill", "#f00");
    			attr(rect, "height", "10");
    			attr(rect, "width", "10");
    			attr(rect, "y", rect_y_value = /*index*/ ctx[1] * 11);
    		},
    		m(target, anchor) {
    			insert(target, rect, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(rect);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let g;
    	let g_transform_value;
    	let each_value = /*days*/ ctx[0];
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

    			attr(g, "transform", g_transform_value = `translate(${/*index*/ ctx[1] * 11}, 0)`);
    		},
    		m(target, anchor) {
    			insert(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*days*/ 1) {
    				const old_length = each_value.length;
    				each_value = /*days*/ ctx[0];
    				let i;

    				for (i = old_length; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (!each_blocks[i]) {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (i = each_value.length; i < old_length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*index*/ 2 && g_transform_value !== (g_transform_value = `translate(${/*index*/ ctx[1] * 11}, 0)`)) {
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
    	let { days } = $$props;
    	let { index } = $$props;

    	$$self.$set = $$props => {
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	return [days, index];
    }

    class Week extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment$1, safe_not_equal, { days: 0, index: 1 });
    	}
    }

    /* src/Heatmap.svelte generated by Svelte v3.19.1 */

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (6:4) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*chunks*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
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
    			if (dirty & /*chunks*/ 2) {
    				each_value_1 = /*chunks*/ ctx[1];
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (2:4) {#if view === 'monthly'}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*chunks*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			if (dirty & /*chunks*/ 2) {
    				each_value = /*chunks*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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

    // (7:8) {#each chunks as chunk, index}
    function create_each_block_1(ctx) {
    	let current;

    	const week = new Week({
    			props: {
    				days: /*chunk*/ ctx[7],
    				index: /*index*/ ctx[11]
    			}
    		});

    	return {
    		c() {
    			create_component(week.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(week, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const week_changes = {};
    			if (dirty & /*chunks*/ 2) week_changes.days = /*chunk*/ ctx[7];
    			week.$set(week_changes);
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
    			destroy_component(week, detaching);
    		}
    	};
    }

    // (3:8) {#each chunks as chunk}
    function create_each_block$1(ctx) {
    	let current;
    	const month = new Month({ props: { days: /*chunk*/ ctx[7] } });

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
    			if (dirty & /*chunks*/ 2) month_changes.days = /*chunk*/ ctx[7];
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
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*view*/ ctx[0] === "monthly") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			svg = svg_element("svg");
    			if_block.c();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { colors = ["#c6e48b", "#7bc96f", "#239a3b", "#196127"] } = $$props;
    	let { data = [] } = $$props;
    	let { emptyColor = "#ebedf0" } = $$props;
    	let { endDate = null } = $$props;
    	let { startDate = null } = $$props;
    	let { view = "yearly" } = $$props;

    	$$self.$set = $$props => {
    		if ("colors" in $$props) $$invalidate(2, colors = $$props.colors);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("emptyColor" in $$props) $$invalidate(4, emptyColor = $$props.emptyColor);
    		if ("endDate" in $$props) $$invalidate(5, endDate = $$props.endDate);
    		if ("startDate" in $$props) $$invalidate(6, startDate = $$props.startDate);
    		if ("view" in $$props) $$invalidate(0, view = $$props.view);
    	};

    	let chunks;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, endDate, startDate, view*/ 105) {
    			 $$invalidate(1, chunks = chunkCalendar({
    				days: getCalendar({ data, endDate, startDate, view }),
    				view
    			}));
    		}
    	};

    	return [view, chunks, colors, data, emptyColor, endDate, startDate];
    }

    class Heatmap extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$2, safe_not_equal, {
    			colors: 2,
    			data: 3,
    			emptyColor: 4,
    			endDate: 5,
    			startDate: 6,
    			view: 0
    		});
    	}
    }

    return Heatmap;

})));
