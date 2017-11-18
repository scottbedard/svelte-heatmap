// for now these are just hard coded. in the future, this
// component should accept props to calculate this.
export const colors = [
    'f00',
    '0f0',
    '00f',
    '0ff',
];

// determine what color a day is
export function dayBackgroundColor(day, minimum, maximum) {
    // console.log (day, minimum, maximum)
    return 'blue'; //'red' + minimum + '-' + maximum
}
