"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockSpeechToTextModule_1 = require("./testing/mockSpeechToTextModule");
const whisper_1 = require("./whisper");
const makeWhisper = (callbacks) => {
    return whisper_1.default.build({
        locale: 'en_US',
        modelPath: '/tmp/test/',
        callbacks,
    });
};
describe('whisper', () => {
    test('should output recognized text without timestamps', async () => {
        const speechToTextMock = (0, mockSpeechToTextModule_1.default)();
        const onPreview = jest.fn();
        const onFinalize = jest.fn();
        const whisper = await makeWhisper({
            onPreview, onFinalize,
        });
        const startPromise = whisper.start();
        speechToTextMock.addRecognizedText('<|0.00|> This is a test. <|1.00|><|2.40|> This should be included in the second preview call. <|3.00|>');
        await whisper.stop();
        await startPromise;
        expect(onFinalize).toHaveBeenLastCalledWith('This is a test. This should be included in the second preview call.');
    });
    test('should preview content before finalizing', async () => {
        const speechToTextMock = (0, mockSpeechToTextModule_1.default)();
        const onPreview = jest.fn();
        const onFinalize = jest.fn();
        const whisper = await makeWhisper({
            onPreview, onFinalize,
        });
        void whisper.start();
        speechToTextMock.addRecognizedText('<|0.00|> Content. <|3.00|>');
        const stopPromise = whisper.stop();
        speechToTextMock.addRecognizedText('<|5.10|> Content 2. <|9.00|>');
        await stopPromise;
        expect(onPreview).toHaveBeenCalledWith('Content.');
        expect(onPreview).toHaveBeenCalledWith('Content 2.');
        expect(onFinalize).toHaveBeenLastCalledWith('Content 2.');
    });
});
//# sourceMappingURL=whisper.test.js.map