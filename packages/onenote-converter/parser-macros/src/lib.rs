use proc_macro2::TokenStream;

use quote::{quote, quote_spanned};
use syn::{parse_macro_input, spanned::Spanned, DeriveInput, Ident};

// See the syn example: https://github.com/dtolnay/syn/blob/master/examples/heapsize/heapsize_derive/src/lib.rs

#[proc_macro_derive(Parse)]
pub fn parseable_derive(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
	let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    let parse_impl = process_fields(name, &ast.data);

    let generated = quote! {
        impl parser_utils::parse::Parse for #name {
            fn parse(reader: parser_utils::Reader) -> parser_utils::errors::Result<Self> {
               #parse_impl
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
                        quote_spanned! {f.span() =>
                            let #name = #type_name::parse(reader)?;
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
