import { WindowFeaturesOptions } from './WindwoFeaturesOptions';

export function generateWindowFeaturesString(
    optionsProp: Partial<WindowFeaturesOptions>
) {
    function valueOf(value: number | boolean | undefined): string | undefined {
        if (typeof value === 'boolean') {
            return value ? '1' : '0';
        } else if (value) {
            return String(value);
        }
    }

    let options: WindowFeaturesOptions = {
        left: 0,
        top: 0,
        height: 600,
        width: 800,
        location: false,
        menubar: false,
        resizable: false,
        scrollbars: false,
        status: false,
        toolbar: false,
    };

    options = { ...options, ...optionsProp };

    return (Object.getOwnPropertyNames(
        options
    ) as (keyof WindowFeaturesOptions)[])
        .map(
            (key: keyof WindowFeaturesOptions) =>
                `${key}=${valueOf(options[key])}`
        )
        .join(',');
}
