use proc_macro2::TokenStream;

use quote::{quote, quote_spanned};
use syn::{DeriveInput, Expr, parse_macro_input, spanned::Spanned};

// See the syn example: https://github.com/dtolnay/syn/blob/master/examples/heapsize/heapsize_derive/src/lib.rs

#[proc_macro_derive(
    Parse,
    attributes(pad_to_alignment, parse_additional_args, validate, count)
)]
pub fn parseable_derive(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;
    let (impl_generics, ty_generics, where_clause) = &ast.generics.split_for_impl();
    let parse_impl = process_fields(&ast.data, &ast.attrs);

    let generated = quote! {
        impl #impl_generics parser_utils::parse::Parse for #name #ty_generics #where_clause {
            fn parse(reader: parser_utils::Reader) -> parser_utils::errors::Result<Self> {
                #parse_impl
            }
        }
    };
    proc_macro::TokenStream::from(generated)
}

fn process_fields(data: &syn::Data, attrs: &Vec<syn::Attribute>) -> TokenStream {
    let validation = attrs
        .iter()
        .map(|a| {
            if a.path().is_ident("validate") {
                let validation: Expr = a
                    .parse_args()
                    .expect("validate must have a single validation argument");
                let validation_str = format!("Failed to validate: {:?}", validation);
                Some(quote_spanned! {validation.span() =>
                    if ! (#validation) {
                        return Err(parser_utils::errors::ErrorKind::ParseValidationFailed(
                            ( #validation_str ).into()
                        ).into());
                    }
                })
            } else {
                None
            }
        })
        .filter_map(|field| field);

    for attr in attrs {
        if attr.path().is_ident("pad_to_alignment") {
            panic!("#[pad_to_alignment(...)] is only permitted on fields");
        }
    }

    match *data {
        syn::Data::Struct(ref data) => {
            match data.fields {
                syn::Fields::Named(ref fields) => {
                    let parse_logic = fields.named.iter().map(|f| {
                        let name = &f.ident;
                        let type_name = &f.ty;
                        let attrs = &f.attrs;

                        // Validate attrs
                        for attr in attrs {
                            if attr.path().is_ident("validate") {
                                panic!("The #[validate(...)] attr is only permitted on toplevel blocks");
                            }
                        }

                        let pad_to_alignment = attrs.iter().find_map(|a| {
                            if a.path().is_ident("pad_to_alignment") {
                                let padding: Expr = a.parse_args().expect("pad_to_alignment must have a single argument. For example, to align to 8 bytes, use #[pad_to_alignment(8)].");
                                Some(quote_spanned! {padding.span() =>
                                    {
                                        let remaining_1 = reader.remaining();
                                        let field_size = _parse_remaining_0 - remaining_1;
                                        let padding = #padding;
                                        let k = field_size / padding + 1;
                                        // Want (field_size + advance = k * padding) for some k.
                                        //    => advance = k * padding - field_size
                                        let advance_by = (k * (#padding) - field_size) % padding;
                                        reader.advance(advance_by)?;
                                    }
                                })
                            } else {
                                None
                            }
                        });

                        let parse_args = attrs.iter().find_map(|a| {
                            if a.path().is_ident("parse_additional_args") {
                                let args: Expr = a.parse_args().expect("parse_additional_args must have a single argument");
                                Some(quote_spanned! {args.span() =>
                                    reader, #args
                                })
                            } else {
                                None
                            }
                        }).unwrap_or(quote! { reader });

                        quote_spanned! {f.span() =>
                            let #name = < #type_name >::parse( #parse_args )?;
                            #pad_to_alignment
                        }
                    });
                    let names = fields.named.iter().map(|f| {
                        let name = &f.ident;
                        quote_spanned! {f.span() =>
                            #name
                        }
                    });

                    quote! {
                        let _parse_remaining_0 = reader.remaining();

                        #(#parse_logic)*
                        #(#validation)*

                        Ok(Self {
                            #(#names),*
                        })
                    }
                }
                syn::Fields::Unnamed(ref _fields) => unimplemented!(),
                syn::Fields::Unit => unimplemented!(),
            }
        }
        syn::Data::Enum(ref _data) => unimplemented!(),
        syn::Data::Union(ref _data) => unimplemented!(),
    }
}
