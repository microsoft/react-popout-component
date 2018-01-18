import { WindowFeaturesOptions } from './WindwoFeaturesOptions';

export interface PopoutProps {
    hidden?: boolean;
    name?: string;
    onClose?: () => void;
    onBeforeUnload?: (evt: BeforeUnloadEvent) => string | null | undefined;
    onBlocked?: () => void;
    children?: any;
    options?: Partial<WindowFeaturesOptions>;
    html?: string;
    url?: string;
}
