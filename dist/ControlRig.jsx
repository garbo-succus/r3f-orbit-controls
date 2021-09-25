import { memo, useCallback, useEffect } from 'react';
import gesturestream from './gesturestream';
import flydDomEvents from 'flyd-dom-events';
import { Raycaster } from 'three';
import { useThree } from '@react-three/fiber';
// Handle interaction events on a DOM object
const ControlRig = memo(({ onGesture, domTarget }) => {
    const target = useThree(useCallback(s => domTarget || s.gl.domElement, [domTarget]));
    // PreventDefault on certain events
    useEffect(() => {
        if (!target)
            return;
        const stream = flydDomEvents([
            'wheel',
            'touchstart',
            'contextmenu' // use long-press/right-click instead (as no iOS support)
        ], target).map((event) => event.preventDefault());
        return () => {
            stream.end(true);
        };
    }, [target]);
    // Connect gesture handler
    useEffect(() => {
        if (!target)
            return;
        const raycaster = new Raycaster();
        const stream = gesturestream(target).map((e) => {
            // TODO: Update raycastery
            onGesture(e, raycaster);
        });
        return () => {
            stream.end(true);
        };
    }, [target, onGesture]);
    return null;
});
export default ControlRig;
