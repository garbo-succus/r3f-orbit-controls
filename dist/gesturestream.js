import flyd from 'flyd';
import flydfilter from 'flyd/module/filter';
import { assoc, dissoc, compose, values, filter, sortBy, take, map } from 'ramda';
import flydDomEvents from 'flyd-dom-events';
const eventTypes = [
    'wheel',
    'pointerover',
    'pointerenter',
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
    'pointerout'
];
// Subtract a list of 2D vectors
const subtract = (...args) => args.reduce(([a1, a2], [b1, b2]) => [a1 - b1, a2 - b2]);
// Divide a list of 2D vectors
const divide = ([a, b], d) => [a / d, b / d];
// Convert 'buttons' int to an array of booleans
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
const bitmaskToArray = (int) => [
    !!(int & 1),
    !!(int & 2),
    !!(int & 4),
    !!(int & 8),
    !!(int & 16)
];
// Add gesture information to an event
const updateGesture = ({ gesture: lastGesture = {}, event: lastEvent }, e) => {
    const { touches: lastTouches, center: lastCenter } = lastGesture;
    const { pointers, event } = e;
    if (!event)
        return {}; // flyd.scan emits empty value on init
    const touchList = compose(map(({ clientX, clientY }) => [clientX, clientY]), take(2), // Ignore 3+ finger gestures
    sortBy((event) => event.pointerId), filter((event) => event.pointerType === 'touch'), values)(pointers);
    const touches = touchList.length;
    const getDeltaCenter = (center) => lastCenter &&
        // Don't calculate delta if we've gone from multitouch to singletouch
        touches === lastTouches &&
        ((lastEvent === null || lastEvent === void 0 ? void 0 : lastEvent.pointerType) !== 'touch' || (lastEvent === null || lastEvent === void 0 ? void 0 : lastEvent.type) !== 'pointerout')
        ? subtract(center, lastCenter)
        : [0, 0];
    const gesture = (() => {
        const targetSize = [event.target.clientWidth, event.target.clientHeight];
        if (touches === 2) {
            const diff2 = subtract(...touchList);
            const center = subtract(touchList[0], divide(diff2, 2));
            const angle = Math.PI + Math.atan2(...diff2);
            const distance = Math.hypot(...diff2);
            return {
                targetSize,
                touches,
                center,
                buttons: bitmaskToArray(touchList[0].buttons),
                deltaXY: getDeltaCenter(center),
                angle,
                deltaAngle: (lastGesture.angle || angle) - angle,
                distance,
                deltaDistance: (lastGesture.distance || distance) - distance
            };
        }
        else {
            const center = [event.clientX, event.clientY];
            const wasTap = event.type === 'pointerup' && (lastEvent === null || lastEvent === void 0 ? void 0 : lastEvent.type) === 'pointerdown';
            const buttons = event.type === 'pointerup' && lastEvent
                ? lastEvent.buttons
                : event.buttons;
            return {
                targetSize,
                touches,
                center,
                buttons: bitmaskToArray(buttons),
                deltaXY: getDeltaCenter(center),
                wasTap
            };
        }
    })();
    return { ...e, gesture };
};
// Update the 'pointers' prop with currently active pointers
const updatePointers = ({ pointers: lastPointers }, e) => {
    const { event } = e;
    const { pointerId, type } = event;
    const pointers = pointerId === undefined || type === 'pointerout' || type === 'pointercancel'
        ? dissoc(pointerId, lastPointers)
        : assoc(pointerId, event, lastPointers);
    return { ...e, pointers };
};
// Returns a flyd stream of gesture events from a DOM object
const gesturestream = (target, options) => compose(flydfilter((e) => e.event), // flyd.scan emits empty value on init
flyd.scan(updateGesture, {}), flyd.scan(updatePointers, {}), flyd.map((event) => ({ event })), flydDomEvents)(eventTypes, target, options);
export default gesturestream;
