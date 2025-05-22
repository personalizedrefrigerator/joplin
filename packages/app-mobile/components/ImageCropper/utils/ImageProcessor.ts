import { Mat33 } from '@js-draw/math';
import { ExpoWebGLRenderingContext } from 'expo-gl';

export type ImageSource = null|{ localUri: string }|HTMLImageElement;

const compileShader = (gl: ExpoWebGLRenderingContext, type: number, code: string) => {
	const shader = gl.createShader(type);
	if (!shader) throw new Error('Shader creation failed.');
	// See webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html and the
	// Expo documentation.
	gl.shaderSource(shader, code);
	gl.compileShader(shader);

	const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!success) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Failed to compile shader: ${log}`);
	}
	return shader;
};

const cornerCoordinates = [
	// Top triangle
	0, 0,
	1, 0,
	0, 1,

	// Bottom triangle
	1, 1,
	1, 0,
	0, 1,
];

export default class ImageProcessor {
	private updateImage: (image: ImageSource)=>void;
	private updateTransform: (transform: Mat33)=>void;
	public constructor(private gl: ExpoWebGLRenderingContext) {
		const program = this.initProgram();
		this.initAttrs(program);
	}

	private initProgram() {
		const gl = this.gl;
		const vShader = compileShader(gl, gl.VERTEX_SHADER, `#version 300 es
			// Use the naming conventions from webgl2fundamentals.org:
			// a_someNameHere for attributes, u_someUniformName for uniforms, etc.
			uniform mat3 u_transform;

			in vec2 a_position;
			out vec2 v_texCoord;

			void main() {
				vec2 positionClipSpace = a_position * 2.0 - vec2(1.0, 1.0);
				vec2 transformedPosition = (u_transform * vec3(positionClipSpace, 1.0)).xy;
				gl_Position = vec4(transformedPosition, 0.0, 1.0);
				// a_position is automatically varied by OpenGL
				v_texCoord = vec2(a_position.x, 1.0 - a_position.y);
			}
		`);

		const fShader = compileShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
			precision highp float;

			uniform sampler2D u_image;

			in vec2 v_texCoord;
			out vec4 o_color;

			void main() {
				vec4 imageColor = texture(u_image, v_texCoord);
				float grayColor = (imageColor.r + imageColor.g + imageColor.b) / 3.0;
				o_color = vec4(grayColor, grayColor, sin(v_texCoord.x * 3.13), imageColor.a);
			}
		`);

		const program = gl.createProgram();
		gl.attachShader(program, vShader);
		gl.attachShader(program, fShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const log = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(`Linking OpenGL program failed. Error: ${log}`);
		}

		gl.useProgram(program);

		return program;
	}

	private initAttrs(program: WebGLProgram) {
		const gl = this.gl;
		const initPositions = (data: Float32Array) => {
			const positionAttrLocation = gl.getAttribLocation(program, 'a_position');
			const positionBuffer = gl.createBuffer();

			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			// gl.STATIC_DRAW -- data is not likely to change frequently.
			gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

			// Enable the vertex array (a_position)
			const vertexArray = gl.createVertexArray();
			gl.bindVertexArray(vertexArray);
			gl.enableVertexAttribArray(positionAttrLocation);

			// Specify types (using the current gl.ARRAY_BUFFER).
			gl.vertexAttribPointer(
				positionAttrLocation,
				2, // size -- pack pairs of components into vec2s
				gl.FLOAT, // type
				false, // normalize
				0, // stride -- Number of entries to skip between iterations
				0, // offset
			);
		};
		const initImageTexture = () => {
			const imageAttrLocation = gl.getUniformLocation(program, 'u_image');

			const texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(imageAttrLocation, 0); // Use texture 0 for u_image

			// Disable repeat
			// See https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			// Minification & magnification -- disable mipmap
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

			let lastImage: ImageSource|null;
			return {
				updateImage: (imageData: ImageSource) => {
					if (!imageData || imageData === lastImage) return;
					lastImage = imageData;
					gl.bindTexture(gl.TEXTURE_2D, texture);
					gl.texImage2D(
						gl.TEXTURE_2D,
						0, // mipLevel
						gl.RGBA, // internalFormat
						gl.RGBA, // srcFormat
						gl.UNSIGNED_BYTE, // srcType
						imageData as any,
					);
				}
			};
		};
		const initTransform = () => {
			const transformAttrLocation = gl.getUniformLocation(program, 'u_transform');

			let lastTransform: Mat33|null = null;
			return {
				updateTransform: (transform: Mat33) => {
					if (transform !== lastTransform) {
						lastTransform = transform;
						gl.uniformMatrix3fv(
							transformAttrLocation,
							false, // transpose
							new Float32Array(transform.toArray()),
						);
					}
				},
			};
		};
		
		initPositions(new Float32Array(cornerCoordinates));
		const { updateImage } = initImageTexture();
		this.updateImage = updateImage;
		const { updateTransform } = initTransform();
		updateTransform(Mat33.identity);
		this.updateTransform = updateTransform;
	}


	public rerender(image: ImageSource, transform: Mat33) {
		this.updateImage(image);
		this.updateTransform(transform);
		this.gl.drawArrays(
			this.gl.TRIANGLES,
			0, // offset
			cornerCoordinates.length / 2, // count -- Number of corners
		);
	}
}
