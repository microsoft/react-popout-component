import { WindowFeaturesOptions } from './WindwoFeaturesOptions';

export interface PopoutProps {
    hidden?: boolean;
    name?: string;
    onClose?: () => void;
    children?: any;
    options?: Partial<WindowFeaturesOptions>;
    html?: string;
}
