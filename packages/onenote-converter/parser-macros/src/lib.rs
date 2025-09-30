use proc_macro2::TokenStream;

use quote::{quote, quote_spanned};
use syn::{parse_macro_input, spanned::Spanned, DeriveInput, Expr, Ident};

// See the syn example: https://github.com/dtolnay/syn/blob/master/examples/heapsize/heapsize_derive/src/lib.rs

#[proc_macro_derive(Parse, attributes(pad_to_alignment))]
pub fn parseable_derive(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
	let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    let parse_impl = process_fields(name, &ast.data);

    let generated = quote! {
        impl parser_utils::parse::Parse for #name {
            fn parse(reader: parser_utils::Reader) -> parser_utils::errors::Result<Self> {
                let remaining_0 = reader.remaining();
                let result = {
                    #parse_impl
                };
                result
            }
        }
    };
    proc_macro::TokenStream::from(generated)
}


fn process_fields(_name: &Ident, data: &syn::Data)->TokenStream {
    match *data {
        syn::Data::Struct(ref data) => {
            match data.fields {
                syn::Fields::Named(ref fields) => {
                    let parse_logic = fields.named.iter().map(|f| {
                        let name = &f.ident;
                        let type_name = &f.ty;
                        let attrs = &f.attrs;
                        let pad_to_size = attrs.iter().find_map(|a| {
                            if a.path().is_ident("pad_to_alignment") {
                                let padding: Expr = a.parse_args().expect("pad_to_alignment must have a single argument");
                                Some(quote_spanned! {padding.span() =>
                                    {
                                        let remaining_1 = reader.remaining();
                                        let field_size = remaining_0 - remaining_1;
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
                        quote_spanned! {f.span() =>
                            let #name = < #type_name >::parse(reader)?;
                            #pad_to_size
                        }
                    });
                    let names = fields.named.iter().map(|f| {
                        let name = &f.ident;
                        quote_spanned! {f.span() =>
                            #name
                        }
                    });

                    quote! {
                        #(#parse_logic)*

                        Ok(Self {
                            #(#names),*
                        })
                    }
                },
                syn::Fields::Unnamed(ref _fields) => unimplemented!(),
                syn::Fields::Unit => unimplemented!(),
            }
        },
        syn::Data::Enum(ref _data) => unimplemented!(),
        syn::Data::Union(ref _data) => unimplemented!(),
    }
}
