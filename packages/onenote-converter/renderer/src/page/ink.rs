use core::f32;

use crate::{page::PositioningContext, utils::{AttributeSet, StyleSet}};
use itertools::Itertools;
use parser::contents::{Ink, InkPoint, InkStroke};

type Vec2 = (f32, f32);

struct InkPart {
    content: String,

    // In DOM coordinates
    size_px: Vec2,
    offset_px: Vec2,
}

pub(crate) struct InkBuilder {
    parts: Vec<InkPart>,
    container_positioning: PositioningContext,
    embedded: bool,
}

impl InkBuilder {
    const SVG_SCALING_FACTOR: f32 = 2540.0 / 96.0;

    pub(crate) fn new(embedded: bool, positioning_stack: PositioningContext) -> Self {
        Self {
            parts: vec![],
            embedded,
            container_positioning: positioning_stack,
        }
    }

    fn reset(&mut self) {
        self.parts.clear();
    }

    pub(crate) fn push(&mut self, ink: &Ink) {
        self.push_rec(ink, (0., 0.));
    }

    pub(crate) fn push_rec(&mut self, ink: &Ink, offset_px: Vec2) {
        let children = ink.child_groups();
        for child in children {
            let offset_x = self.container_positioning.offset_x + child.offset_horizontal().unwrap_or_default() * 48.;
            let offset_y = self.container_positioning.offset_y + child.offset_vertical().unwrap_or_default() * 48.;
            self.push_rec(child, (offset_x, offset_y));
        }

        let strokes = ink.ink_strokes();
        if strokes.is_empty() {
            return;
        }

        let stroke_strength = strokes[0].width().max(strokes[0].height()).max(140.0);

        let offset_horizontal = ink
            .offset_horizontal()
            .filter(|_| !self.embedded)
            .unwrap_or_default();
        let offset_vertical = ink
            .offset_vertical()
            .filter(|_| !self.embedded)
            .unwrap_or_default();

        let (x_min, width) = get_boundary(strokes, |p| p.x());
        let (y_min, height) = get_boundary(strokes, |p| p.y());

        let x_min = x_min - stroke_strength / 2.0;
        let y_min = y_min - stroke_strength / 2.0;

        let width = width + stroke_strength + Self::SVG_SCALING_FACTOR;
        let height = height + stroke_strength + Self::SVG_SCALING_FACTOR;

        let height_px = (height / (Self::SVG_SCALING_FACTOR)).ceil();
        let width_px = (width / (Self::SVG_SCALING_FACTOR)).ceil();

        let left_px = x_min / Self::SVG_SCALING_FACTOR + offset_horizontal * 48.0 + offset_px.0;
        let top_px = y_min / Self::SVG_SCALING_FACTOR + offset_vertical * 48.0 + offset_px.1;

        // Transform everything into pixel units:
        let translate = (
            left_px * Self::SVG_SCALING_FACTOR - x_min,
            top_px * Self::SVG_SCALING_FACTOR - y_min,
        );
        let scale = 1. / Self::SVG_SCALING_FACTOR;
        let path = self.render_ink_path(strokes, scale, translate);

        self.parts.push(InkPart {
            content: path,

            size_px: (width_px, height_px),
            offset_px: (left_px, top_px),
        })
    }

    pub(crate) fn finish(&mut self) -> String {
        let result = self.build();
        self.reset();

        result
    }

    fn build(&self) -> String {
        if self.parts.is_empty() {
            return "".into();
        }

        let path = self.parts.iter().map(|part| &part.content).join("");

        let (offset_x, offset_y, width, height) = {
            let mut min_x = f32::INFINITY;
            let mut max_x = f32::NEG_INFINITY;
            let mut min_y = f32::INFINITY;
            let mut max_y = f32::NEG_INFINITY;

            for item in self.parts.iter() {
                min_x = min_x.min(item.offset_px.0);
                min_y = min_y.min(item.offset_px.1);
                max_x = max_x.max(item.offset_px.0 + item.size_px.0);
                max_y = max_y.max(item.offset_px.1 + item.size_px.1);
            }

            (min_x, min_y, max_x - min_x, max_y - min_y)
        };

        let offset_x = round_svg_value(offset_x);
        let offset_y = round_svg_value(offset_y);
        let width = round_svg_value(width);
        let height = round_svg_value(height);

        let mut attrs = AttributeSet::new();
        attrs.set(
            "viewBox",
            format!("{} {} {} {}", offset_x, offset_y, width, height),
        );

        let mut styles = StyleSet::new();
        styles.set("position", "absolute".into());
        let left = offset_x - self.container_positioning.offset_x;
        styles.set("left", format!("{left}px"));
        let top = offset_y - self.container_positioning.offset_y;
        styles.set("top", format!("{top}px"));
        styles.set("width", format!("{width}px"));
        styles.set("height", format!("{height}px"));
        // Allow selecting text behind the ink:
        styles.set("pointer-events", "none".into());

        attrs.set("style", styles.to_string());

        if self.embedded {
            let mut span_styles = StyleSet::new();
            span_styles.set("width", format!("{width}px"));
            span_styles.set("height", format!("{height}px"));

            format!(
                "<span style=\"{}\" class=\"ink-text\"><svg {}>{}</svg></span>",
                span_styles, attrs, path
            )
        } else {
            format!("<svg {}>{}</svg>", attrs, path)
        }
    }

    fn render_ink_path(&self, strokes: &[InkStroke], scale: f32, translate: Vec2) -> String {
        if strokes.is_empty() {
            return "".into();
        }

        let mut attrs = AttributeSet::new();

        attrs.set(
            "d",
            strokes
                .iter()
                .map(|stroke| self.render_ink_path_points(stroke, scale, translate))
                .collect_vec()
                .join(" "),
        );

        let stroke = &strokes[0];

        let opacity = (255 - stroke.transparency().unwrap_or_default()) as f32 / 256.0;
        attrs.set("opacity", format!("{:.2}", opacity));

        let color = if let Some(value) = stroke.color() {
            let r = value % 256;

            let rem = (value - r) / 256;
            let g = rem % 256;

            let rem = (rem - g) / 256;
            let b = rem % 256;

            format!("rgb({}, {}, {})", r, g, b)
        } else {
            "WindowText".to_string()
        };
        attrs.set("stroke", color);

        attrs.set("stroke-width", (stroke.width() * scale).round().to_string());

        let pen_type = stroke.pen_tip().unwrap_or_default();
        attrs.set(
            "stroke-linejoin",
            if pen_type == 0 { "round" } else { "bevel" }.to_string(),
        );
        attrs.set(
            "stroke-linecap",
            if pen_type == 0 { "round" } else { "square" }.to_string(),
        );

        attrs.set("fill", "none".to_string());

        // For debugging
        attrs.set(
            "data-stroke-ids",
            strokes.iter().map(|s| format!("{:?}", s.id())).join(", ")
        );

        format!("<path {} />", attrs)
    }

    fn render_ink_path_points(&self, stroke: &InkStroke, scale: f32, translate: Vec2) -> String {
        let path = stroke.path();
        if path.is_empty() {
            return "".into();
        }

        let display_point = |p: &InkPoint| -> String {
            let x = p.x() * scale;
            let y = p.y() * scale;
            format!("{} {}", round_svg_value(x), round_svg_value(y))
        };

        let start = &path[0];
        let mut path = path[1..].iter().map(display_point).collect_vec();

        if path.is_empty() {
            path.push("0 0".to_string());
        }

        let offset_x = ((start.x() + translate.0) * scale).floor();
        let offset_y = ((start.y() + translate.1) * scale).floor();

        format!("M {} {} l {}", offset_x, offset_y, path.join(" "))
    }
}

fn get_boundary<F: Fn(&InkPoint) -> f32>(strokes: &[InkStroke], coord: F) -> (f32, f32) {
    if strokes.is_empty() {
        return (0.0, 0.0);
    }

    let mut min = f32::INFINITY;
    let mut max = f32::NEG_INFINITY;

    for stroke in strokes {
        let path = stroke.path();
        if path.is_empty() {
            continue;
        }

        let start = coord(&path[0]);

        let mut pos = start;
        if pos < min {
            min = pos;
        }
        if pos > max {
            max = pos;
        }

        for point in path[1..].iter() {
            pos += coord(point);

            if pos < min {
                min = pos;
            }
            if pos > max {
                max = pos;
            }
        }
    }

    (min, max - min)
}

fn round_svg_value(x: f32) -> f32 {
    (x * 100.).round() / 100.
}
