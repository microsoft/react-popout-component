import { popouts } from './popouts';

export function insertPopoutStylesheetRule(rule: string) {
    Object.keys(popouts).forEach(popoutKey => {
        const popout = popouts[popoutKey];
        if (popout.child && popout.styleElement) {
            try {
                // tslint:disable-next-line:no-any
                const { sheet }: any = popout.styleElement;
                sheet.insertRule(rule, sheet.cssRules.length);
            } catch (e) {
                /* no-op on errors */
            }
        }
    });
}
