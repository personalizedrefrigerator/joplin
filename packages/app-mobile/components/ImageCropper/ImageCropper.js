"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_native_1 = require("react-native");
const expo_gl_1 = require("expo-gl");
const react_1 = require("react");
const ImageProcessor_1 = require("./utils/ImageProcessor");
const useAsyncEffect_1 = require("@joplin/lib/hooks/useAsyncEffect");
const shim_1 = require("@joplin/lib/shim");
const path_1 = require("@joplin/utils/path");
const getImageDimensions_1 = require("../../utils/image/getImageDimensions");
const math_1 = require("@js-draw/math");
const time_1 = require("@joplin/utils/time");
const useImageSize = (uri) => {
    const [size, setSize] = (0, react_1.useState)(null);
    (0, useAsyncEffect_1.default)(async (event) => {
        const dimens = await (0, getImageDimensions_1.default)(uri);
        if (event.cancelled)
            return;
        setSize(dimens);
    }, [uri]);
    return size;
};
const ImageProcessorView = ({ imageUri, imageMime }) => {
    const [image, setImage] = (0, react_1.useState)(null);
    const [gl, setGl] = (0, react_1.useState)();
    const size = useImageSize(imageUri);
    (0, useAsyncEffect_1.default)(async (event) => {
        if (react_native_1.Platform.OS === 'web') {
            const fsDriver = shim_1.default.fsDriver();
            const uri = await fsDriver.readFile(imageUri, 'base64');
            if (event.cancelled)
                return;
            const image = new Image();
            const loadPromise = new Promise((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error('Image load failed'));
            });
            image.src = `data:${imageMime};base64,${uri}`;
            await loadPromise;
            console.log('loaded image', image.complete);
            setImage(image);
        }
        else {
            setImage({ localUri: (0, path_1.toFileProtocolPath)(imageUri) });
        }
    }, [imageUri, imageMime]);
    const imageProcessor = (0, react_1.useMemo)(() => {
        return gl ? new ImageProcessor_1.default(gl) : null;
    }, [gl]);
    const onRender = (0, react_1.useCallback)(() => {
        if (!gl || !size)
            return;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        if (imageProcessor) {
            const sizeVector = math_1.Vec2.of(size.width, size.height);
            const transform = math_1.Mat33
                // Switch to global canvas space
                .scaling2D(sizeVector)
                .rightMul(math_1.Mat33.zRotation(performance.now() / 1000))
                // Switch back to image space
                .rightMul(math_1.Mat33.scaling2D(math_1.Vec2.of(1 / sizeVector.x, 1 / sizeVector.y)));
            imageProcessor.rerender(image, transform);
        }
        gl.flush();
        gl.endFrameEXP();
    }, [gl, imageProcessor, image, size]);
    (0, useAsyncEffect_1.default)(async (event) => {
        while (!event.cancelled) {
            onRender();
            await (0, time_1.msleep)(0.1);
        }
    }, [onRender]);
    const onContextCreate = (0, react_1.useCallback)((gl) => {
        setGl(gl);
    }, []);
    const windowSize = (0, react_native_1.useWindowDimensions)();
    const scale = size ? Math.min(windowSize.width / size.width, windowSize.height / size.height) : 1;
    return React.createElement(react_native_1.View, { style: {
            transform: [{
                    scale: scale,
                }],
            alignItems: 'center',
            flex: 1,
        } },
        React.createElement(expo_gl_1.GLView, { style: size !== null && size !== void 0 ? size : { width: 300, height: 300 }, onContextCreate: onContextCreate }));
};
exports.default = ImageProcessorView;
//# sourceMappingURL=ImageCropper.js.map