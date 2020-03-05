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
    	child_ctx[13] = list[i];
    	child_ctx[9] = i;
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
    			attr(rect, "data-date", rect_data_date_value = /*day*/ ctx[13].date);
    			attr(rect, "data-value", rect_data_value_value = /*day*/ ctx[13].value);
    			attr(rect, "fill", rect_fill_value = /*day*/ ctx[13].color);
    			attr(rect, "height", /*cellSize*/ ctx[2]);
    			attr(rect, "rx", /*cellRadius*/ ctx[0]);
    			attr(rect, "width", /*cellSize*/ ctx[2]);
    			attr(rect, "x", rect_x_value = /*day*/ ctx[13].date.getDay() * /*cellRect*/ ctx[1]);
    			attr(rect, "y", rect_y_value = getWeekIndex(/*day*/ ctx[13].date) * /*cellRect*/ ctx[1] + /*monthLabelHeight*/ ctx[7]);
    		},
    		m(target, anchor) {
    			insert(target, rect, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*days*/ 8 && rect_data_date_value !== (rect_data_date_value = /*day*/ ctx[13].date)) {
    				attr(rect, "data-date", rect_data_date_value);
    			}

    			if (dirty & /*days*/ 8 && rect_data_value_value !== (rect_data_value_value = /*day*/ ctx[13].value)) {
    				attr(rect, "data-value", rect_data_value_value);
    			}

    			if (dirty & /*days*/ 8 && rect_fill_value !== (rect_fill_value = /*day*/ ctx[13].color)) {
    				attr(rect, "fill", rect_fill_value);
    			}

    			if (dirty & /*cellSize*/ 4) {
    				attr(rect, "height", /*cellSize*/ ctx[2]);
    			}

    			if (dirty & /*cellRadius*/ 1) {
    				attr(rect, "rx", /*cellRadius*/ ctx[0]);
    			}

    			if (dirty & /*cellSize*/ 4) {
    				attr(rect, "width", /*cellSize*/ ctx[2]);
    			}

    			if (dirty & /*days, cellRect*/ 10 && rect_x_value !== (rect_x_value = /*day*/ ctx[13].date.getDay() * /*cellRect*/ ctx[1])) {
    				attr(rect, "x", rect_x_value);
    			}

    			if (dirty & /*days, cellRect, monthLabelHeight*/ 138 && rect_y_value !== (rect_y_value = getWeekIndex(/*day*/ ctx[13].date) * /*cellRect*/ ctx[1] + /*monthLabelHeight*/ ctx[7])) {
    				attr(rect, "y", rect_y_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(rect);
    		}
    	};
    }

    // (14:4) {#if monthLabelHeight > 0}
    function create_if_block(ctx) {
    	let text_1;
    	let t_value = /*monthLabels*/ ctx[8][/*index*/ ctx[9]] + "";
    	let t;

    	return {
    		c() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr(text_1, "alignment-baseline", "hanging");
    			attr(text_1, "fill", /*fontColor*/ ctx[4]);
    			attr(text_1, "font-family", /*fontFamily*/ ctx[5]);
    			attr(text_1, "font-size", /*fontSize*/ ctx[6]);
    			attr(text_1, "x", "0");
    			attr(text_1, "y", "0");
    		},
    		m(target, anchor) {
    			insert(target, text_1, anchor);
    			append(text_1, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*monthLabels, index*/ 768 && t_value !== (t_value = /*monthLabels*/ ctx[8][/*index*/ ctx[9]] + "")) set_data(t, t_value);

    			if (dirty & /*fontColor*/ 16) {
    				attr(text_1, "fill", /*fontColor*/ ctx[4]);
    			}

    			if (dirty & /*fontFamily*/ 32) {
    				attr(text_1, "font-family", /*fontFamily*/ ctx[5]);
    			}

    			if (dirty & /*fontSize*/ 64) {
    				attr(text_1, "font-size", /*fontSize*/ ctx[6]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(text_1);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let g;
    	let each_1_anchor;
    	let g_transform_value;
    	let each_value = /*days*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = /*monthLabelHeight*/ ctx[7] > 0 && create_if_block(ctx);

    	return {
    		c() {
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			if (if_block) if_block.c();
    			attr(g, "transform", g_transform_value = `translate(${/*translation*/ ctx[10]}, 0)`);
    		},
    		m(target, anchor) {
    			insert(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}

    			append(g, each_1_anchor);
    			if (if_block) if_block.m(g, null);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*days, cellSize, cellRadius, cellRect, getWeekIndex, monthLabelHeight*/ 143) {
    				each_value = /*days*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*monthLabelHeight*/ ctx[7] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(g, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*translation*/ 1024 && g_transform_value !== (g_transform_value = `translate(${/*translation*/ ctx[10]}, 0)`)) {
    				attr(g, "transform", g_transform_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(g);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { cellGap } = $$props;
    	let { cellRadius } = $$props;
    	let { cellRect } = $$props;
    	let { cellSize } = $$props;
    	let { days } = $$props;
    	let { fontColor } = $$props;
    	let { fontFamily } = $$props;
    	let { fontSize } = $$props;
    	let { index } = $$props;
    	let { monthGap } = $$props;
    	let { monthLabelHeight } = $$props;
    	let { monthLabels } = $$props;

    	$$self.$set = $$props => {
    		if ("cellGap" in $$props) $$invalidate(11, cellGap = $$props.cellGap);
    		if ("cellRadius" in $$props) $$invalidate(0, cellRadius = $$props.cellRadius);
    		if ("cellRect" in $$props) $$invalidate(1, cellRect = $$props.cellRect);
    		if ("cellSize" in $$props) $$invalidate(2, cellSize = $$props.cellSize);
    		if ("days" in $$props) $$invalidate(3, days = $$props.days);
    		if ("fontColor" in $$props) $$invalidate(4, fontColor = $$props.fontColor);
    		if ("fontFamily" in $$props) $$invalidate(5, fontFamily = $$props.fontFamily);
    		if ("fontSize" in $$props) $$invalidate(6, fontSize = $$props.fontSize);
    		if ("index" in $$props) $$invalidate(9, index = $$props.index);
    		if ("monthGap" in $$props) $$invalidate(12, monthGap = $$props.monthGap);
    		if ("monthLabelHeight" in $$props) $$invalidate(7, monthLabelHeight = $$props.monthLabelHeight);
    		if ("monthLabels" in $$props) $$invalidate(8, monthLabels = $$props.monthLabels);
    	};

    	let translation;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cellRect, cellGap, monthGap, index*/ 6658) {
    			 $$invalidate(10, translation = (7 * cellRect - cellGap + monthGap) * index);
    		}
    	};

    	return [
    		cellRadius,
    		cellRect,
    		cellSize,
    		days,
    		fontColor,
    		fontFamily,
    		fontSize,
    		monthLabelHeight,
    		monthLabels,
    		index,
    		translation,
    		cellGap,
    		monthGap
    	];
    }

    class Month extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			cellGap: 11,
    			cellRadius: 0,
    			cellRect: 1,
    			cellSize: 2,
    			days: 3,
    			fontColor: 4,
    			fontFamily: 5,
    			fontSize: 6,
    			index: 9,
    			monthGap: 12,
    			monthLabelHeight: 7,
    			monthLabels: 8
    		});
    	}
    }

    /* src/views/Week.svelte generated by Svelte v3.19.1 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[4] = i;
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
    			attr(rect, "data-date", rect_data_date_value = stringifyDate(/*day*/ ctx[6].date));
    			attr(rect, "data-value", rect_data_value_value = /*day*/ ctx[6].value);
    			attr(rect, "fill", rect_fill_value = /*day*/ ctx[6].color);
    			attr(rect, "height", /*cellSize*/ ctx[2]);
    			attr(rect, "rx", /*cellRadius*/ ctx[0]);
    			attr(rect, "width", /*cellSize*/ ctx[2]);
    			attr(rect, "y", rect_y_value = /*index*/ ctx[4] * /*cellRect*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, rect, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*days*/ 8 && rect_data_date_value !== (rect_data_date_value = stringifyDate(/*day*/ ctx[6].date))) {
    				attr(rect, "data-date", rect_data_date_value);
    			}

    			if (dirty & /*days*/ 8 && rect_data_value_value !== (rect_data_value_value = /*day*/ ctx[6].value)) {
    				attr(rect, "data-value", rect_data_value_value);
    			}

    			if (dirty & /*days*/ 8 && rect_fill_value !== (rect_fill_value = /*day*/ ctx[6].color)) {
    				attr(rect, "fill", rect_fill_value);
    			}

    			if (dirty & /*cellSize*/ 4) {
    				attr(rect, "height", /*cellSize*/ ctx[2]);
    			}

    			if (dirty & /*cellRadius*/ 1) {
    				attr(rect, "rx", /*cellRadius*/ ctx[0]);
    			}

    			if (dirty & /*cellSize*/ 4) {
    				attr(rect, "width", /*cellSize*/ ctx[2]);
    			}

    			if (dirty & /*cellRect*/ 2 && rect_y_value !== (rect_y_value = /*index*/ ctx[4] * /*cellRect*/ ctx[1])) {
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
    	let each_value = /*days*/ ctx[3];
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

    			attr(g, "transform", g_transform_value = `translate(${/*translation*/ ctx[5]}, 0)`);
    		},
    		m(target, anchor) {
    			insert(target, g, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*stringifyDate, days, cellSize, cellRadius, cellRect*/ 15) {
    				each_value = /*days*/ ctx[3];
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

    			if (dirty & /*translation*/ 32 && g_transform_value !== (g_transform_value = `translate(${/*translation*/ ctx[5]}, 0)`)) {
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
    	let { cellRadius } = $$props;
    	let { cellRect } = $$props;
    	let { cellSize } = $$props;
    	let { days } = $$props;
    	let { index } = $$props;

    	$$self.$set = $$props => {
    		if ("cellRadius" in $$props) $$invalidate(0, cellRadius = $$props.cellRadius);
    		if ("cellRect" in $$props) $$invalidate(1, cellRect = $$props.cellRect);
    		if ("cellSize" in $$props) $$invalidate(2, cellSize = $$props.cellSize);
    		if ("days" in $$props) $$invalidate(3, days = $$props.days);
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    	};

    	let translation;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cellRect, index*/ 18) {
    			 $$invalidate(5, translation = cellRect * index);
    		}
    	};

    	return [cellRadius, cellRect, cellSize, days, index, translation];
    }

    class Week extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			cellRadius: 0,
    			cellRect: 1,
    			cellSize: 2,
    			days: 3,
    			index: 4
    		});
    	}
    }

    /* src/Heatmap.svelte generated by Svelte v3.19.1 */

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (19:4) {:else}
    function create_else_block(ctx) {
    	let g;
    	let g_transform_value;
    	let current;
    	let if_block = /*dayLabelWidth*/ ctx[3] > 0 && create_if_block_2(ctx);
    	let each_value_1 = /*chunks*/ ctx[13];
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

    			attr(g, "transform", g_transform_value = `translate(${/*dayLabelWidth*/ ctx[3]})`);
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
    			if (/*dayLabelWidth*/ ctx[3] > 0) {
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

    			if (dirty[0] & /*fontColor, fontFamily, fontSize, cellRect, monthLabels, chunks, monthLabelHeight, isNewMonth, cellRadius, cellSize*/ 145126) {
    				each_value_1 = /*chunks*/ ctx[13];
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

    			if (!current || dirty[0] & /*dayLabelWidth*/ 8 && g_transform_value !== (g_transform_value = `translate(${/*dayLabelWidth*/ ctx[3]})`)) {
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
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*chunks*/ ctx[13];
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
    			if (dirty[0] & /*cellGap, cellRadius, cellRect, cellSize, chunks, fontColor, fontFamily, fontSize, monthGap, monthLabelHeight, monthLabels*/ 14311) {
    				each_value = /*chunks*/ ctx[13];
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

    // (20:8) {#if dayLabelWidth > 0}
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*dayLabels*/ ctx[4];
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
    			if (dirty[0] & /*fontColor, fontFamily, fontSize, dayLabelPosition, dayLabels*/ 65776) {
    				each_value_2 = /*dayLabels*/ ctx[4];
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

    // (21:12) {#each dayLabels as label, index}
    function create_each_block_2(ctx) {
    	let text_1;
    	let t_value = /*label*/ ctx[30] + "";
    	let t;
    	let text_1_y_value;

    	return {
    		c() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr(text_1, "alignment-baseline", "middle");
    			attr(text_1, "fill", /*fontColor*/ ctx[5]);
    			attr(text_1, "font-family", /*fontFamily*/ ctx[6]);
    			attr(text_1, "font-size", /*fontSize*/ ctx[7]);
    			attr(text_1, "x", "0");
    			attr(text_1, "y", text_1_y_value = /*dayLabelPosition*/ ctx[16](/*index*/ ctx[28]));
    		},
    		m(target, anchor) {
    			insert(target, text_1, anchor);
    			append(text_1, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*dayLabels*/ 16 && t_value !== (t_value = /*label*/ ctx[30] + "")) set_data(t, t_value);

    			if (dirty[0] & /*fontColor*/ 32) {
    				attr(text_1, "fill", /*fontColor*/ ctx[5]);
    			}

    			if (dirty[0] & /*fontFamily*/ 64) {
    				attr(text_1, "font-family", /*fontFamily*/ ctx[6]);
    			}

    			if (dirty[0] & /*fontSize*/ 128) {
    				attr(text_1, "font-size", /*fontSize*/ ctx[7]);
    			}

    			if (dirty[0] & /*dayLabelPosition*/ 65536 && text_1_y_value !== (text_1_y_value = /*dayLabelPosition*/ ctx[16](/*index*/ ctx[28]))) {
    				attr(text_1, "y", text_1_y_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(text_1);
    		}
    	};
    }

    // (44:16) {#if monthLabelHeight > 0 && isNewMonth(chunks, index)}
    function create_if_block_1(ctx) {
    	let text_1;
    	let t_value = /*monthLabels*/ ctx[10][/*chunk*/ ctx[26][0].date.getMonth()] + "";
    	let t;
    	let text_1_x_value;

    	return {
    		c() {
    			text_1 = svg_element("text");
    			t = text(t_value);
    			attr(text_1, "alignment-baseline", "hanging");
    			attr(text_1, "fill", /*fontColor*/ ctx[5]);
    			attr(text_1, "font-family", /*fontFamily*/ ctx[6]);
    			attr(text_1, "font-size", /*fontSize*/ ctx[7]);
    			attr(text_1, "x", text_1_x_value = /*cellRect*/ ctx[12] * /*index*/ ctx[28]);
    		},
    		m(target, anchor) {
    			insert(target, text_1, anchor);
    			append(text_1, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*monthLabels, chunks*/ 9216 && t_value !== (t_value = /*monthLabels*/ ctx[10][/*chunk*/ ctx[26][0].date.getMonth()] + "")) set_data(t, t_value);

    			if (dirty[0] & /*fontColor*/ 32) {
    				attr(text_1, "fill", /*fontColor*/ ctx[5]);
    			}

    			if (dirty[0] & /*fontFamily*/ 64) {
    				attr(text_1, "font-family", /*fontFamily*/ ctx[6]);
    			}

    			if (dirty[0] & /*fontSize*/ 128) {
    				attr(text_1, "font-size", /*fontSize*/ ctx[7]);
    			}

    			if (dirty[0] & /*cellRect*/ 4096 && text_1_x_value !== (text_1_x_value = /*cellRect*/ ctx[12] * /*index*/ ctx[28])) {
    				attr(text_1, "x", text_1_x_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(text_1);
    		}
    	};
    }

    // (34:12) {#each chunks as chunk, index}
    function create_each_block_1(ctx) {
    	let g;
    	let g_transform_value;
    	let show_if = /*monthLabelHeight*/ ctx[9] > 0 && /*isNewMonth*/ ctx[17](/*chunks*/ ctx[13], /*index*/ ctx[28]);
    	let if_block_anchor;
    	let current;

    	const week = new Week({
    			props: {
    				cellRadius: /*cellRadius*/ ctx[1],
    				cellRect: /*cellRect*/ ctx[12],
    				cellSize: /*cellSize*/ ctx[2],
    				days: /*chunk*/ ctx[26],
    				index: /*index*/ ctx[28]
    			}
    		});

    	let if_block = show_if && create_if_block_1(ctx);

    	return {
    		c() {
    			g = svg_element("g");
    			create_component(week.$$.fragment);
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(g, "transform", g_transform_value = `translate(0, ${/*monthLabelHeight*/ ctx[9]})`);
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
    			if (dirty[0] & /*cellRadius*/ 2) week_changes.cellRadius = /*cellRadius*/ ctx[1];
    			if (dirty[0] & /*cellRect*/ 4096) week_changes.cellRect = /*cellRect*/ ctx[12];
    			if (dirty[0] & /*cellSize*/ 4) week_changes.cellSize = /*cellSize*/ ctx[2];
    			if (dirty[0] & /*chunks*/ 8192) week_changes.days = /*chunk*/ ctx[26];
    			week.$set(week_changes);

    			if (!current || dirty[0] & /*monthLabelHeight*/ 512 && g_transform_value !== (g_transform_value = `translate(0, ${/*monthLabelHeight*/ ctx[9]})`)) {
    				attr(g, "transform", g_transform_value);
    			}

    			if (dirty[0] & /*monthLabelHeight, chunks*/ 8704) show_if = /*monthLabelHeight*/ ctx[9] > 0 && /*isNewMonth*/ ctx[17](/*chunks*/ ctx[13], /*index*/ ctx[28]);

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
    				cellRadius: /*cellRadius*/ ctx[1],
    				cellRect: /*cellRect*/ ctx[12],
    				cellSize: /*cellSize*/ ctx[2],
    				days: /*chunk*/ ctx[26],
    				fontColor: /*fontColor*/ ctx[5],
    				fontFamily: /*fontFamily*/ ctx[6],
    				fontSize: /*fontSize*/ ctx[7],
    				index: /*index*/ ctx[28],
    				monthGap: /*monthGap*/ ctx[8],
    				monthLabelHeight: /*monthLabelHeight*/ ctx[9],
    				monthLabels: /*monthLabels*/ ctx[10]
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
    			if (dirty[0] & /*cellGap*/ 1) month_changes.cellGap = /*cellGap*/ ctx[0];
    			if (dirty[0] & /*cellRadius*/ 2) month_changes.cellRadius = /*cellRadius*/ ctx[1];
    			if (dirty[0] & /*cellRect*/ 4096) month_changes.cellRect = /*cellRect*/ ctx[12];
    			if (dirty[0] & /*cellSize*/ 4) month_changes.cellSize = /*cellSize*/ ctx[2];
    			if (dirty[0] & /*chunks*/ 8192) month_changes.days = /*chunk*/ ctx[26];
    			if (dirty[0] & /*fontColor*/ 32) month_changes.fontColor = /*fontColor*/ ctx[5];
    			if (dirty[0] & /*fontFamily*/ 64) month_changes.fontFamily = /*fontFamily*/ ctx[6];
    			if (dirty[0] & /*fontSize*/ 128) month_changes.fontSize = /*fontSize*/ ctx[7];
    			if (dirty[0] & /*monthGap*/ 256) month_changes.monthGap = /*monthGap*/ ctx[8];
    			if (dirty[0] & /*monthLabelHeight*/ 512) month_changes.monthLabelHeight = /*monthLabelHeight*/ ctx[9];
    			if (dirty[0] & /*monthLabels*/ 1024) month_changes.monthLabels = /*monthLabels*/ ctx[10];
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
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*view*/ ctx[11] === "monthly") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			svg = svg_element("svg");
    			if_block.c();
    			attr(svg, "viewBox", svg_viewBox_value = `0 0 ${/*width*/ ctx[15]} ${/*height*/ ctx[14]}`);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			if_blocks[current_block_type_index].m(svg, null);
    			current = true;
    		},
    		p(ctx, dirty) {
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

    			if (!current || dirty[0] & /*width, height*/ 49152 && svg_viewBox_value !== (svg_viewBox_value = `0 0 ${/*width*/ ctx[15]} ${/*height*/ ctx[14]}`)) {
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
    	let { cellRadius = 0 } = $$props;
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
    	let { monthLabelHeight = 10 } = $$props;

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
    		if ("allowOverflow" in $$props) $$invalidate(18, allowOverflow = $$props.allowOverflow);
    		if ("cellGap" in $$props) $$invalidate(0, cellGap = $$props.cellGap);
    		if ("cellRadius" in $$props) $$invalidate(1, cellRadius = $$props.cellRadius);
    		if ("cellSize" in $$props) $$invalidate(2, cellSize = $$props.cellSize);
    		if ("colors" in $$props) $$invalidate(19, colors = $$props.colors);
    		if ("data" in $$props) $$invalidate(20, data = $$props.data);
    		if ("dayLabelWidth" in $$props) $$invalidate(3, dayLabelWidth = $$props.dayLabelWidth);
    		if ("dayLabels" in $$props) $$invalidate(4, dayLabels = $$props.dayLabels);
    		if ("emptyColor" in $$props) $$invalidate(21, emptyColor = $$props.emptyColor);
    		if ("endDate" in $$props) $$invalidate(22, endDate = $$props.endDate);
    		if ("fontColor" in $$props) $$invalidate(5, fontColor = $$props.fontColor);
    		if ("fontFamily" in $$props) $$invalidate(6, fontFamily = $$props.fontFamily);
    		if ("fontSize" in $$props) $$invalidate(7, fontSize = $$props.fontSize);
    		if ("monthGap" in $$props) $$invalidate(8, monthGap = $$props.monthGap);
    		if ("monthLabelHeight" in $$props) $$invalidate(9, monthLabelHeight = $$props.monthLabelHeight);
    		if ("monthLabels" in $$props) $$invalidate(10, monthLabels = $$props.monthLabels);
    		if ("startDate" in $$props) $$invalidate(23, startDate = $$props.startDate);
    		if ("view" in $$props) $$invalidate(11, view = $$props.view);
    	};

    	let cellRect;
    	let calendar;
    	let chunks;
    	let weekRect;
    	let height;
    	let width;
    	let dayLabelPosition;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*cellSize, cellGap*/ 5) {
    			 $$invalidate(12, cellRect = cellSize + cellGap);
    		}

    		if ($$self.$$.dirty[0] & /*allowOverflow, colors, data, emptyColor, endDate, startDate, view*/ 16517120) {
    			 $$invalidate(24, calendar = getCalendar({
    				allowOverflow,
    				colors,
    				data,
    				emptyColor,
    				endDate,
    				startDate,
    				view
    			}));
    		}

    		if ($$self.$$.dirty[0] & /*view, allowOverflow, calendar, endDate, startDate*/ 29624320) {
    			 $$invalidate(13, chunks = view === "monthly"
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

    		if ($$self.$$.dirty[0] & /*cellRect, cellGap*/ 4097) {
    			 $$invalidate(25, weekRect = 7 * cellRect - cellGap);
    		}

    		if ($$self.$$.dirty[0] & /*view, cellRect, cellGap, monthLabelHeight, weekRect*/ 33561089) {
    			 $$invalidate(14, height = view === "monthly"
    			? 6 * cellRect - cellGap + monthLabelHeight
    			: weekRect + monthLabelHeight); // <- max of 6 rows in monthly view
    		}

    		if ($$self.$$.dirty[0] & /*view, weekRect, monthGap, chunks, cellRect, cellGap, dayLabelWidth*/ 33569033) {
    			 $$invalidate(15, width = view === "monthly"
    			? (weekRect + monthGap) * chunks.length - monthGap
    			: cellRect * chunks.length - cellGap + dayLabelWidth);
    		}

    		if ($$self.$$.dirty[0] & /*cellRect, monthLabelHeight*/ 4608) {
    			 $$invalidate(16, dayLabelPosition = index => {
    				return cellRect * index + cellRect / 2 + monthLabelHeight;
    			});
    		}
    	};

    	return [
    		cellGap,
    		cellRadius,
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

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				allowOverflow: 18,
    				cellGap: 0,
    				cellRadius: 1,
    				cellSize: 2,
    				colors: 19,
    				data: 20,
    				dayLabelWidth: 3,
    				dayLabels: 4,
    				emptyColor: 21,
    				endDate: 22,
    				fontColor: 5,
    				fontFamily: 6,
    				fontSize: 7,
    				monthGap: 8,
    				monthLabelHeight: 9,
    				monthLabels: 10,
    				startDate: 23,
    				view: 11
    			},
    			[-1, -1]
    		);
    	}
    }

    return Heatmap;

})));
