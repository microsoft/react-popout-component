import { popouts } from './popouts';
import * as globalContext from './globalContext';

const monitors: {
    [id: string]: any;
} = {};

const delay = 250;

function start(id: string) {
    const monitor = () => {
        if (popouts[id] && popouts[id].props.onClose) {
            if (!popouts[id].child || popouts[id].child!.closed) {
                stop(id);
                popouts[id].props.onClose!();
                popouts[id].child = null;
            } else {
                monitors[id] = setTimeout(monitor, delay);
            }
        }
    };

    monitors[id] = setTimeout(monitor, delay);
}

function stop(id: string) {
    if (monitors[id]) {
        clearTimeout(monitors[id]);
        delete monitors[id];
    }
}

globalContext.set('startMonitor', start);
