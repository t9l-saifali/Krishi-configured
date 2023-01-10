

// import moment from "moment";
// import { useEffect, useState } from "react";
// import Rating from "react-rating";
// import { connect } from "react-redux";
// import { withRouter } from "react-router";
// import { Link } from "react-router-dom";
// import swal from "sweetalert";
// import { addToCart, quantityChange, userdetails } from "../../../src/redux/actions/actions";
// import { ApiRequest } from "../../apiServices/ApiRequest";
// import { imageUrl } from "../../imageUrl";
// import GroupProduct from "../Group/Group_Product";
// import sendCartDataToAPI from "../sendCartDataToAPI";

// function ProductCard({
//   productData,
//   cartItemQuantity,
//   quantityChange,
//   dataInCart,
//   addToCart,
//   user_details,
//   changeSubscribeTrue,
//   reviewRatingShow,
//   index,
// }) {
//   const [item, setItem] = useState(productData);
//   const [selPck, setSelPck] = useState([]);
//   const [quantityshow, setQuantityshow] = useState(0);
//   const [openGroupProduct, setOpenGroupProduct] = useState(false);
//   const [showFirstPriceOnLoad, setShowFirstPriceOnLoad] = useState(true);
//   const [price, setPrice] = useState(0);
//   const [addddd, setaddddd] = useState(false);

//   useEffect(() => {
//     setItem(productData);
//   }, []);

//   //adding selected property and quantity to each product
//   useEffect(() => {
//     let itm = item;
//     if (showFirstPriceOnLoad) {
//       let price = 0;
//       let priceIndex;
//       if (itm.TypeOfProduct === "simple") {
//         itm.simpleData[0] === undefined ||
//           (itm.simpleData[0].package[0] &&
//             itm.simpleData[0].package.forEach((pck, inde) => {
//               if (!price) {
//                 if (user_details.length !== 0) {
//                   if (user_details.user_type === "b2b") {
//                     console.log(itm.product_name + "  " + pck.B2B_price);
//                     price = pck.B2B_price || 0;
//                   } else if (user_details.user_type === "retail") {
//                     price = pck.Retail_price || 0;
//                   } else if (user_details.user_type === "user") {
//                     price = pck.selling_price || 0;
//                   }
//                 }
//                 if (price) {
//                   priceIndex = inde;
//                 }
//               }
//             }));
//       }
//       if (itm.simpleData[0] && itm.simpleData[0].package.length > 0) {
//         itm.simpleData[0].package.map((pck, index) => {
//           let userPrice = 0;
//           console.log(user_details);
//           if (user_details.length !== 0) {
//             if (user_details.user_type === "b2b") {
//               userPrice = pck.B2B_price || 0;
//             } else if (user_details.user_type === "retail") {
//               userPrice = pck.Retail_price || 0;
//             } else {
//               userPrice = pck.selling_price || 0;
//             }
//           } else {
//             userPrice = pck.selling_price || 0;
//           }
//           if (pck.quantity) {
//           } else {
//             pck.quantity = 0;
//           }
//           pck.userPrice = userPrice;
//           if (priceIndex) {
//             if (index === priceIndex) {
//               pck.selected = true;
//             } else {
//               pck.selected = false;
//             }
//           } else {
//             if (index === 0) {
//               pck.selected = true;
//             } else {
//               pck.selected = false;
//             }
//           }
//         });
//       }
//     }
//     let cartData = [];
//     let dataInCart1 = dataInCart ? [...dataInCart] : [];
//     //looping throught cart and pushing them in cartData array with its packages quantity and normal quantity
//     dataInCart1.forEach((item) => {
//       var quantity = 0;
//       var selectedPck = [];
//       if (item.TypeOfProduct === "simple") {
//         if (item.TypeOfProduct === "simple" && item.simpleData[0].package.length > 0) {
//           item.simpleData[0].package.forEach((pck) => {
//             if (pck.selected) {
//               selectedPck.push(pck);
//             }
//           });
//         } else {
//           quantity = item.simpleData[0].userQuantity;
//         }
//       }
//       if (cartData.length > 0) {
//         if (
//           cartData.filter((i) => {
//             return i._id === item._id;
//           }).length > 0
//         ) {
//           let modified = cartData.map((cartItem) => {
//             if (cartItem._id === item._id) {
//               return {
//                 ...cartItem,
//                 packages: cartItem.packages.concat(selectedPck),
//               };
//             } else {
//               return cartItem;
//             }
//           });
//           cartData = modified;
//         } else {
//           cartData.push({
//             _id: item._id,
//             withoutpackagequantity: quantity,
//             packages: selectedPck,
//           });
//         }
//       } else {
//         cartData.push({
//           _id: item._id,
//           withoutpackagequantity: quantity,
//           packages: selectedPck,
//         });
//       }
//     });

//     //looping thorught all products and adding quantity to each product from cart
//     if (cartData.length > 0) {
//       if (
//         cartData.filter((i) => {
//           return i._id === itm._id;
//         }).length > 0
//       ) {
//         cartData.map((cartItem) => {
//           if (cartItem._id === itm._id) {
//             if (itm.simpleData && itm.simpleData[0]) {
//               itm.simpleData[0].package[0]
//                 ? itm.simpleData[0].package.map((pck, index) => {
//                     if (cartItem.packages.filter((c) => c._id === pck._id).length > 0) {
//                       cartItem.packages.map((cartPck) => {
//                         if (pck._id === cartPck._id && pck.packet_size === cartPck.packet_size) {
//                           return (pck.quantity = cartPck.quantity);
//                         }
//                       });
//                     } else {
//                       return (pck.quantity = 0);
//                     }
//                   })
//                 : (itm.simpleData[0].userQuantity = cartItem.withoutpackagequantity);

//               if (itm.simpleData[0].package.filter((a) => a.selected).length === 0) {
//                 itm.simpleData[0].package.map((a, i) => (i === 0 ? (a.selected = true) : (a.selected = false)));
//               }
//             }
//           } else {
//             if (itm.simpleData && itm.simpleData[0]) {
//               if (itm.simpleData[0].package[0]) {
//                 let selectedOne = itm.simpleData[0].package.filter((a) => a.selected);
//                 itm.simpleData[0].package.map((pck, index) => {
//                   if (pck.quantity) {
//                   } else {
//                     pck.quantity = 0;
//                   }
//                 });
//                 if (selectedOne.length === 0 || !selectedOne) {
//                   itm.simpleData[0].package.map((pck, index) => {
//                     if (index === 0) {
//                       pck.selected = true;
//                     } else {
//                       pck.selected = false;
//                     }
//                   });
//                 }
//               } else {
//                 itm.simpleData[0].userQuantity = 0;
//               }
//             }
//           }
//         });
//       } else {
//         if (itm.simpleData && itm.simpleData[0]) {
//           if (itm.simpleData[0].package[0]) {
//             let selectedOne = itm.simpleData[0].package.filter((a) => a.selected);
//             itm.simpleData[0].package.map((pck, index) => {
//               if (pck.quantity) {
//                 pck.quantity = 0; //added for updation
//               } else {
//                 pck.quantity = 0;
//               }
//             });
//             if (selectedOne.length === 0 || !selectedOne) {
//               itm.simpleData[0].package.map((pck, index) => {
//                 if (index === 0) {
//                   pck.selected = true;
//                 } else {
//                   pck.selected = false;
//                 }
//               });
//             }
//           } else {
//             itm.simpleData[0].userQuantity = 0;
//           }
//         }
//       }
//     } else {
//       if (itm.simpleData && itm.simpleData[0]) {
//         if (itm.simpleData[0].package[0]) {
//           let selectedOne = itm.simpleData[0].package.filter((a) => a.selected);
//           itm.simpleData[0].package.map((pck, index) => {
//             if (pck.quantity) {
//               pck.quantity = 0; //added for upadtion
//             } else {
//               pck.quantity = 0;
//             }
//           });
//           if (selectedOne.length === 0 || !selectedOne) {
//             itm.simpleData[0].package.map((pck, index) => {
//               if (index === 0) {
//                 pck.selected = true;
//               } else {
//                 pck.selected = false;
//               }
//             });
//           }
//         } else {
//           itm.simpleData[0].userQuantity = 0;
//         }
//       }
//     }
//   }, [item, cartItemQuantity]);

//   //calculating price of product and setting quantityshow
//   useEffect(() => {
//     let price1 = price;
//     if (item.TypeOfProduct === "simple") {
//       // console.log(item?.simpleData, "item?.simpleDataitem?.simpleDataitem?.simpleDataitem?.simpleData");
//       if (item?.simpleData.length > 0) {
//         if (item.simpleData[0].package[0]) {
//           item.simpleData[0].package.map((pck, index) => {
//             if (pck.selected) {
//               setQuantityshow(pck.quantity);
//               if (user_details.length !== 0) {
//                 if (user_details.user_type === "b2b") {
//                   price1 = pck.B2B_price;
//                 } else if (user_details.user_type === "retail") {
//                   price1 = pck.Retail_price;
//                 } else if (user_details.user_type === "user" || user_details.user_type === null) {
//                   price1 = pck.selling_price;
//                 }
//               } else {
//                 if (pck.selling_price) {
//                   price1 = pck.selling_price;
//                 } else {
//                   price1 = pck.packetmrp;
//                 }
//               }
//             } else if (showFirstPriceOnLoad && index === 0) {
//               setQuantityshow(pck.quantity);
//               if (user_details.length !== 0) {
//                 if (user_details.user_type === "b2b") {
//                   price1 = pck.B2B_price;
//                 } else if (user_details.user_type === "retail") {
//                   price1 = pck.Retail_price;
//                 } else if (user_details.user_type === "user" || user_details.user_type === null) {
//                   price1 = pck.selling_price;
//                 }
//               } else {
//                 if (pck.selling_price) {
//                   price1 = pck.selling_price;
//                 } else {
//                   price1 = pck.packetmrp;
//                 }
//               }
//             }
//           });
//         } else {
//           setQuantityshow(item.simpleData[0].userQuantity);
//           if (user_details.length !== 0) {
//             if (user_details.user_type === "b2b") {
//               price1 = item.simpleData[0].RegionB2BPrice;
//             } else if (user_details.user_type === "retail") {
//               price1 = item.simpleData[0].RegionRetailPrice;
//             } else if (user_details.user_type === "user") {
//               price1 = item.simpleData[0].RegionSellingPrice;
//             } else if (user_details.user_type === null) {
//               price1 = item.simpleData[0].RegionSellingPrice;
//             } else {
//             }
//           } else {
//             if (item.simpleData[0].RegionSellingPrice) {
//               price1 = item.simpleData[0].RegionSellingPrice;
//             } else {
//               price1 = item.simpleData[0].mrp;
//             }
//           }
//         }
//       }
//     }
//     setSelPck(item.simpleData[0] && item.simpleData[0].package.length > 0 ? item.simpleData[0].package.filter((a) => a.selected) : []);
//     setPrice(price1);
//   }, [cartItemQuantity]);

//   //handle package selection change
//   const handleChange = (e) => {
//     const selectedPackageId = e.target.value;
//     const id = e.target.id;
//     setShowFirstPriceOnLoad(false);
//     let price1 = price;

//     let itm = item;
//     //making selected value false of previously selected item
//     if (itm.simpleData[0]) {
//       if (itm.simpleData[0]._id === id) {
//         itm.simpleData[0].package.map((pck) => {
//           pck.selected = false;
//         });
//       }
//     }

//     //adding value true to selected item
//     if (itm.simpleData[0]) {
//       if (itm.simpleData[0]._id === id) {
//         itm.simpleData[0].package.map((pck) => {
//           if (pck._id === selectedPackageId) {
//             pck.selected = true;
//             setSelPck(pck);

//             setQuantityshow(pck.quantity);
//             if (user_details.length !== 0) {
//               if (user_details.user_type === "b2b") {
//                 price1 = pck.B2B_price;
//               } else if (user_details.user_type === "retail") {
//                 price1 = pck.Retail_price;
//               } else if (user_details.user_type === "user" || user_details.user_type === null) {
//                 price1 = pck.selling_price;
//               }
//             } else {
//               if (pck.selling_price) {
//                 price1 = pck.selling_price;
//               } else {
//                 price1 = pck.packetmrp;
//               }
//             }
//           }
//         });
//       }
//     }
//     setPrice(price1);
//   };

//   //adding cart added products in cartItem State
//   const addToCart1 = async (selectedItem = item) => {
//     var already_cart = false;
//     var realTimeCart = localStorage.getItem("cartItem") ? JSON.parse(localStorage.getItem("cartItem")) : [];
//     var quantityInCart = 0;
//     let errorPresent = false;
//     let selectedItmPck = selectedItem.simpleData[0].package.length > 0 ? selectedItem.simpleData[0].package.filter((pck) => pck.selected) : "";

//     //adding 1 quantity first time in without package products
//     if (!selectedItem.simpleData[0].userQuantity) {
//       selectedItem.simpleData[0].userQuantity = 1;
//     }
//     let availableLocalQuantity = selectedItem.simpleData[0].availableQuantity;
//     let name = selectedItem.product_name;

//     var cartSelectedPck = [];
//     if (realTimeCart.length > 0) {
//       realTimeCart.map((itm) => {
//         if (itm._id === selectedItem._id) {
//           if (itm.simpleData[0].package[0]) {
//             itm.simpleData[0].package.map((i) => {
//               if (i.selected) {
//                 cartSelectedPck.push(i._id);
//                 quantityInCart = i.quantity;
//               }
//             });
//           } else {
//             quantityInCart = itm.simpleData[0].userQuantity;
//           }
//         }
//       });

//       if (selectedItem.simpleData[0].package[0]) {
//         selectedItem.simpleData[0].package.map((sId) => {
//           if (sId.selected) {
//             if (
//               cartSelectedPck.filter((i) => {
//                 return i === sId._id;
//               }).length > 0
//             ) {
//               already_cart = true;
//               let quantityError = false;
//               selectedItem.simpleData[0].package.map((itmitm, indind) => {
//                 if (itmitm.selected === true) {
//                   availableLocalQuantity = +availableLocalQuantity / +itmitm.packet_size;
//                   if (+availableLocalQuantity >= +selectedItem.simpleData[0].package[indind].quantity + 1) {
//                     selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity + 1;
//                   } else {
//                     quantityError = true;
//                     errorPresent = true;
//                     swal({
//                       title: "Error!",
//                       text:
//                         "You can not add " +
//                         name +
//                         " more than " +
//                         selectedItem.simpleData[0]?.availableQuantity +
//                         " " +
//                         selectedItem.unitMeasurement?.name,
//                       icon: "warning",
//                     });
//                   }
//                 }
//               });
//               realTimeCart.map((itm) => {
//                 if (itm._id === selectedItem._id) {
//                   itm.simpleData[0].package.map((pck) => {
//                     if (pck.selected) {
//                       if (pck._id === selectedItmPck[0]._id && !quantityError) {
//                         return (pck.quantity = pck.quantity + 1);
//                       }
//                     }
//                   });
//                 }
//               });
//               addToCart([]);
//               localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
//               addToCart(realTimeCart);
//             } else {
//               addToCart([]);
//               selectedItem.simpleData[0].package.map((itmitm, indind) => {
//                 const productQu = +selectedItem.simpleData[0].package[indind].quantity;
//                 availableLocalQuantity = +availableLocalQuantity / +itmitm.packet_size;
//                 if (itmitm.selected === true && +availableLocalQuantity >= productQu + 1) {
//                   selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity + 1;
//                 }
//                 if (itmitm.selected === true && +availableLocalQuantity < productQu + 1) {
//                   swal({
//                     title: "Error!",
//                     text:
//                       "You can not add" +
//                       name +
//                       " more than " +
//                       selectedItem.simpleData[0]?.availableQuantity +
//                       " " +
//                       selectedItem.unitMeasurement?.name,
//                     icon: "warning",
//                   });
//                   errorPresent = true;
//                 }
//               });
//               if (!errorPresent) {
//                 realTimeCart.push(selectedItem);
//               }
//               localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
//               addToCart(realTimeCart);
//             }
//           }
//         });
//       } else {
//         if (
//           realTimeCart.filter((i) => {
//             return i._id === selectedItem._id;
//           }).length > 0
//         ) {
//           already_cart = true;
//           realTimeCart.map((itm) => {
//             if (itm._id === selectedItem._id) {
//               return availableLocalQuantity > itm.simpleData[0].userQuantity
//                 ? (itm.simpleData[0].userQuantity = quantityInCart + 1)
//                 : (itm.simpleData[0].userQuantity = quantityInCart);
//             }
//           });
//           if (+availableLocalQuantity >= +selectedItem.simpleData[0].userQuantity + 1) {
//             selectedItem.simpleData[0].userQuantity = quantityInCart + 1;
//           } else {
//             errorPresent = true;
//             swal({
//               title: "Error!",
//               text:
//                 "You can not add " + name + " more than " + selectedItem.simpleData[0]?.availableQuantity + " " + selectedItem.unitMeasurement?.name,
//               icon: "warning",
//             });
//           }
//           addToCart([]);
//           localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
//           addToCart(realTimeCart);
//         } else {
//           already_cart = false;
//           addToCart([]);
//           realTimeCart.push(selectedItem);
//           localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
//           addToCart(realTimeCart);
//         }
//       }
//     } else {
//       already_cart = false;
//       selectedItem.simpleData[0].package.map((itmitm, indind) => {
//         if (itmitm.selected === true) {
//           availableLocalQuantity = +availableLocalQuantity / +itmitm.packet_size;
//           if (+availableLocalQuantity >= +selectedItem.simpleData[0].package[indind].quantity + 1) {
//             selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity + 1;
//           } else {
//             errorPresent = true;
//             swal({
//               title: "Error!",
//               text:
//                 "You can not add " + name + " more than " + selectedItem.simpleData[0]?.availableQuantity + " " + selectedItem.unitMeasurement?.name,
//               icon: "warning",
//             });
//           }
//         }
//       });
//       if (!errorPresent) {
//         addToCart([]);
//         realTimeCart.push(selectedItem);
//         localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
//         addToCart(realTimeCart);
//       }
//     }

//     if (!errorPresent) {
//       setQuantityshow((prv) => prv + 1);
//       await sendCartDataToAPI([selectedItem], user_details, addToCart)
//         .then((res) => {
//           if (selectedItem.preOrder === true && realTimeCart.length === 1 && already_cart === false) {
//             swal({
//               title: "Pre-ordering produce?",
//               text: "You will only be able to see products available for delivery on the same day as the pre-order product.",
//               icon: "warning",
//               dangerMode: true,
//               buttons: {
//                 confirm: {
//                   text: "Go ahead",
//                   value: true,
//                   visible: true,
//                   className: "",
//                   closeModal: true,
//                 },
//                 cancel: {
//                   text: "Go back",
//                   value: false,
//                   visible: true,
//                   className: "back-swal-btn",
//                   closeModal: true,
//                 },
//               },
//             }).then((confirm) => {
//               if (confirm) {
//                 localStorage.setItem("status", true);
//                 if (changeSubscribeTrue) {
//                   changeSubscribeTrue();
//                 }
//               } else {
//                 newarrayofcart = newarrayofcart ? newarrayofcart.filter((itm) => itm._id !== selectedItem._id) : [];
//                 localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
//                 addToCart([]);
//                 addToCart(newarrayofcart);
//                 addToCart([]);
//                 quantityChange(!cartItemQuantity);
//               }
//             });
//           }

//           if (res.data.data === "you can not add both item") {
//             swal({
//               title: "Pre-ordering produce?",
//               text: "You will only be able to see products available for delivery on the same day as the pre-order product and your current cart will get empty.",
//               icon: "warning",
//               dangerMode: true,
//               buttons: {
//                 confirm: {
//                   text: "Go ahead",
//                   value: true,
//                   visible: true,
//                   className: "",
//                   closeModal: true,
//                 },
//                 cancel: {
//                   text: "Go back",
//                   value: false,
//                   visible: true,
//                   className: "back-swal-btn",
//                   closeModal: true,
//                 },
//               },
//             }).then((confirm) => {
//               if (confirm) {
//                 let emptyarray = [];
//                 localStorage.setItem("status", true);
//                 changeSubscribeToggleAPI(true);
//                 localStorage.setItem("cartItem", JSON.stringify(emptyarray));
//                 addToCart([]);
//                 localStorage.setItem("cartItem", JSON.stringify([selectedItem]));
//                 addToCart([selectedItem]);
//                 if (changeSubscribeTrue) {
//                   changeSubscribeTrue();
//                 }
//                 quantityChange(!cartItemQuantity);
//               } else {
//                 var newarrayofcart = realTimeCart;
//                 newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
//                 localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
//                 addToCart([]);
//                 addToCart(newarrayofcart);
//                 quantityChange(!cartItemQuantity);
//               }
//             });
//           } else if (res.data.data === "you can order one preorder product at a time.") {
//             const preorderItemsInCart = realTimeCart.filter((a) => a.preOrder);
//             if (selectedItem._id === preorderItemsInCart[0]._id) {
//             } else {
//               swal({
//                 title: "Pre-ordering produce?",
//                 text: "You can only order one pre-order product at a time.",
//                 icon: "warning",
//                 dangerMode: true,
//                 buttons: {
//                   // confirm: {
//                   //   text: "Go ahead",
//                   //   value: true,
//                   //   visible: true,
//                   //   className: "",
//                   //   closeModal: true,
//                   // },
//                   cancel: {
//                     text: "Ok",
//                     value: false,
//                     visible: true,
//                     className: "back-swal-btn",
//                     closeModal: true,
//                   },
//                 },
//               }).then((confirm) => {
//                 if (confirm) {
//                   let emptyarray = [];
//                   localStorage.setItem("status", true);
//                   changeSubscribeToggleAPI(true);
//                   localStorage.setItem("cartItem", JSON.stringify(emptyarray));
//                   addToCart([]);
//                   addToCart([]);
//                   localStorage.setItem("cartItem", JSON.stringify([selectedItem]));
//                   addToCart([selectedItem]);

//                   if (changeSubscribeTrue) {
//                     changeSubscribeTrue();
//                   }

//                   quantityChange(!cartItemQuantity);
//                 } else {
//                   var newarrayofcart = realTimeCart;
//                   newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
//                   localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
//                   addToCart([]);
//                   addToCart(newarrayofcart);

//                   quantityChange(!cartItemQuantity);
//                 }
//               });
//             }
//           } else if (res.data.result === "user_id Required") {
//             var newarrayofcart = realTimeCart;
//             var checkingarraypoping = realTimeCart;
//             checkingarraypoping = checkingarraypoping.filter((itm) => itm._id !== selectedItem._id);
//             // checkingarraypoping.splice(checkingarraypoping.length,1);
//             var checkingarray = [];
//             checkingarray = checkingarraypoping;

//             if (JSON.parse(localStorage.getItem("status")) == true) {
//               for (var j = 0; j < checkingarray.length; j++) {
//                 if (checkingarray[j].preOrder === selectedItem.preOrder && selectedItem.preOrder === true) {
//                   newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
//                   localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
//                   addToCart([]);
//                   addToCart(newarrayofcart);

//                   swal({
//                     title: "Pre-ordering produce?",
//                     text: "You can only order one pre-order product at a time.",
//                     icon: "warning",
//                     dangerMode: true,
//                     buttons: {
//                       cancel: {
//                         text: "Ok",
//                         value: false,
//                         visible: true,
//                         className: "back-swal-btn",
//                         closeModal: true,
//                       },
//                       // cancel: {
//                       //   text: "Ok",
//                       //   value: false,
//                       //   visible: true,
//                       //   className: "back-swal-btn",
//                       //   closeModal: true,
//                       // },
//                     },
//                   }).then((confirm) => {
//                     if (confirm) {
//                     }
//                   });
//                 } else if (checkingarray[j] && selectedItem.preOrder === true) {
//                   swal({
//                     title: "Pre-ordering produce?",
//                     text: "You will only be able to see products available for delivery on the same day as the pre-order product.",
//                     icon: "warning",
//                     dangerMode: true,
//                   });
//                 }
//               }
//             } else {
//               for (var i = 0; i < checkingarray.length; i++) {
//                 if (checkingarray[i].preOrder === selectedItem.preOrder && selectedItem.preOrder === true) {
//                   newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
//                   localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
//                   addToCart(newarrayofcart);

//                   swal({
//                     title: "Pre-ordering produce?",
//                     text: "You can only order one pre-order product at a time.",
//                     icon: "warning",
//                     dangerMode: true,
//                     buttons: {
//                       cancel: {
//                         text: "Ok",
//                         value: false,
//                         visible: true,
//                         className: "back-swal-btn",
//                         closeModal: true,
//                       },
//                       // cancel: {
//                       //   text: "Ok",
//                       //   value: false,
//                       //   visible: true,
//                       //   className: "back-swal-btn",
//                       //   closeModal: true,
//                       // },
//                     },
//                   }).then((confirm) => {
//                     if (confirm) {
//                     }
//                   });
//                 } else if (checkingarray[i] && selectedItem.preOrder === true) {
//                   swal({
//                     title: "Pre-ordering produce?",
//                     text: "You will only be able to see products available for delivery on the same day as the pre-order product and your current cart will get empty.",
//                     icon: "warning",
//                     dangerMode: true,
//                     buttons: {
//                       confirm: {
//                         text: "Go ahead",
//                         value: true,
//                         visible: true,
//                         className: "",
//                         closeModal: true,
//                       },
//                       cancel: {
//                         text: "Go back",
//                         value: false,
//                         visible: true,
//                         className: "back-swal-btn",
//                         closeModal: true,
//                       },
//                     },
//                   }).then((confirm) => {
//                     if (confirm) {
//                       let emptyarray = [];
//                       localStorage.setItem("status", true);
//                       changeSubscribeToggleAPI(true);
//                       localStorage.setItem("cartItem", JSON.stringify(emptyarray));
//                       addToCart([]);
//                       // window.location = "/product/" + selectedItem.product_name;
//                       if (changeSubscribeTrue) {
//                         changeSubscribeTrue();
//                       }
//                       addToCart([]);
//                       localStorage.setItem("cartItem", JSON.stringify([selectedItem]));
//                       addToCart([selectedItem]);
//                     } else {
//                       newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
//                       localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
//                       addToCart([]);
//                       addToCart(newarrayofcart);
//                     }
//                   });
//                 }
//               }
//             }
//           } else if (res.data.message === "errror") {
//             swal({
//               title: "Error!",
//               text: "You can not add " + res.data.data.join(""),
//               icon: "warning",
//               dangerMode: true,
//             });
//             var newarrayofcart = realTimeCart;
//             let webPck;
//             newarrayofcart = newarrayofcart.filter((itm) => {
//               let cartP = itm.TypeOfProduct === "simple" ? itm.simpleData[0].package.filter((c) => c.selected) : [];
//               webPck = selectedItem.simpleData[0].package.filter((a) => a.selected);
//               console.log(cartP[0]?._id, webPck[0]._id, cartP[0]?._id !== webPck[0]._id);
//               if (itm._id !== selectedItem._id) {
//                 return itm;
//               } else {
//                 if (cartP[0]?._id !== webPck[0]._id) {
//                   return itm;
//                 }
//               }
//             });
//             localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
//             addToCart([]);
//             addToCart(newarrayofcart);
//             setTimeout(() => {
//               let itm = item;
//               if (itm._id === selectedItem._id) {
//                 //looping thorught all products and adding quantity to each product from cart
//                 if (itm.simpleData && itm.simpleData[0]) {
//                   itm.simpleData[0].package[0]
//                     ? itm.simpleData[0].package.map((pck, index) => {
//                         if (pck._id === webPck[0]._id) {
//                           pck.quantity = quantityInCart > 0 ? quantityInCart : 0;
//                         }
//                         if (quantityInCart === 0) {
//                           if (pck._id === webPck[0]._id) {
//                             pck.selected = true;
//                           } else {
//                             pck.selected = false;
//                           }
//                         }
//                       })
//                     : (itm.simpleData[0].userQuantity = 0);
//                 }
//               }
//             }, 0);
//             quantityChange(!cartItemQuantity);
//           } else {
//           }
//         })
//         .catch((error) => {
//           console.log(error);
//         });

//       localStorage.setItem("coupon_code", "");
//       localStorage.setItem("freepackage", "");
//       localStorage.setItem("freeproduct", "");
//       localStorage.setItem("couponStatus", 2);
//       localStorage.setItem("discount_amount", "");
//     }
//   };

//   //subtracting from cart
//   const subtractFromCart = async (selectedItem = item) => {
//     // setLoading(true);
//     var already_cart = false;
//     var quantityInCart = 0;
//     let modifiedSelectedItem;
//     var realTimeCart = localStorage.getItem("cartItem") ? JSON.parse(localStorage.getItem("cartItem")) : [];
//     let selectedItmPck = selectedItem.simpleData[0].package.length > 0 ? selectedItem.simpleData[0].package.filter((pck) => pck.selected) : "";
//     var cartSelectedPck = [];
//     if (realTimeCart.length > 0) {
//       realTimeCart.map((itm) => {
//         if (itm._id === selectedItem._id) {
//           if (itm.simpleData[0].package[0]) {
//             itm.simpleData[0].package.map((i) => {
//               if (i.selected) {
//                 cartSelectedPck.push(i._id);
//                 quantityInCart = i.quantity;
//               }
//             });
//           } else {
//             quantityInCart = itm.simpleData[0].userQuantity;
//           }
//         }
//       });

//       if (selectedItem.simpleData[0].package[0]) {
//         selectedItem.simpleData[0].package.map((itmitm, indind) => {
//           if (itmitm.selected === true) {
//             selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity - 1;
//           }
//         });
//         selectedItem.simpleData[0].package.map((sId) => {
//           if (sId.selected) {
//             if (
//               cartSelectedPck.filter((i) => {
//                 return i === sId._id;
//               }).length > 0
//             ) {
//               already_cart = true;
//               if (quantityInCart <= 1) {
//                 // deleting item from cart if quantity is 1.
//                 realTimeCart = realTimeCart.filter((itm) => {
//                   if (itm._id === selectedItem._id) {
//                     if (itm.simpleData[0].package.length > 0) {
//                       let samePackageProduct = false;
//                       itm.simpleData[0].package.map((pck) => {
//                         if (pck.selected) {
//                           if (pck._id === selectedItmPck[0]._id) {
//                             samePackageProduct = true;
//                           } else {
//                           }
//                         }
//                       });
//                       if (!samePackageProduct) {
//                         return itm;
//                       } else {
//                         return;
//                       }
//                     } else {
//                       return itm;
//                     }
//                   } else {
//                     return itm;
//                   }
//                 });
//               } else {
//                 //subtracting 1 quantity from selected item in cart.
//                 realTimeCart.map((itm) => {
//                   if (itm._id === selectedItem._id) {
//                     itm.simpleData[0].package.map((pck) => {
//                       if (pck.selected) {
//                         if (pck._id === selectedItmPck[0]._id) {
//                           return (pck.quantity = pck.quantity - 1);
//                         }
//                       }
//                     });
//                   }
//                 });
//               }
//               addToCart([]);
//               localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
//               addToCart(realTimeCart);
//             } else {
//               let name = selectedItem.product_name;
//               swal({
//                 // title: ,
//                 text: "Please add " + name + "  in your cart",
//                 icon: "warning",
//                 dangerMode: true,
//               });
//             }
//           }
//         });
//       } else {
//         if (
//           realTimeCart.filter((i) => {
//             return i._id === selectedItem._id;
//           }).length > 0
//         ) {
//           already_cart = true;
//           if (quantityInCart <= 1) {
//             realTimeCart = realTimeCart.filter((itm) => itm._id !== selectedItem._id);
//           } else {
//             realTimeCart.map((itm) => {
//               if (itm._id === selectedItem._id) {
//                 return (itm.simpleData[0].userQuantity = quantityInCart - 1);
//               }
//             });
//           }
//           addToCart([]);
//           localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
//           addToCart(realTimeCart);
//         } else {
//           already_cart = false;

//           let name = selectedItem.product_name;
//           swal({
//             // title: ,
//             text: "Please add " + name + "  in your cart",
//             icon: "warning",
//             dangerMode: true,
//           });
//         }
//       }
//     } else {
//       already_cart = false;
//       let name = selectedItem.product_name;
//       swal({
//         // title: ,
//         text: "Please add " + name + "  in your cart",
//         icon: "warning",
//         dangerMode: true,
//       });
//     }

//     setQuantityshow((prv) => prv - 1);
//     await sendCartDataToAPI([selectedItem], user_details, addToCart)
//       .then((res) => {
//         // setLoading(false);
//       })
//       .catch((err) => console.log(err));
//   };

//   const changeSubscribeToggleAPI = (status) => {
//     let requestData = {
//       _id: user_details._id,
//       subscribeToggle: status,
//     };
//     ApiRequest(requestData, "/subscribe/toggle/status", "POST")
//       .then((res) => {})
//       .catch((error) => {
//         console.log(error);
//       });
//   };

//   const showOutofstockAlert = (item) => {
//     swal({
//       // title: ,
//       text: item.product_name + " is currently out of stock",
//       icon: "warning",
//       dangerMode: true,
//     });
//   };

//   return (
//     <>
//       {openGroupProduct ? <GroupProduct addddd={addddd} closeGroup={() => setOpenGroupProduct(false)} groupProductData={item} /> : ""}
//       {price || item.TypeOfProduct === "group" ? (
//         <div className={item.outOfStock || item.preOrder === true ? "product-list-col out-of-stock-product" : "product-list-col"} key={item._id}>
//           {item.preOrder ? (
//             <p className="stocke-text-pre">
//               <span className="pre-order" style={{ display: "inline-block" }}>
//                 PRE-ORDER FOR <br />
//                 {item.preOrderEndDate ? moment(item.preOrderEndDate).format("DD/MM/YYYY") : ""}
//               </span>
//             </p>
//           ) : (
//             item.outOfStock && <p className="stocke-text">Out Of Stock</p>
//           )}
//           <div className="product-thumb">
//             {item.images && item.images.length > 0 ? (
//               <Link to={"/product/" + item.slug}>
//                 {" "}
//                 <img src={imageUrl + item.images[0].image} alt="primary" />
//               </Link>
//             ) : (
//               <img src={imageUrl + localStorage.getItem("prdImg")} alt="dummy" />
//             )}
//           </div>
//           <div className="product-list-description">
//             <div className="product-list-price">
//               <span className="price-product">
//                 {item.TypeOfProduct === "simple" ? "₹ " + price : ""}
//                 {item.TypeOfProduct === "group" && item?.base_price ? "₹ " + item?.base_price : ""}
//                 <span className="old-price">
//                   {item.TypeOfProduct === "simple"
//                     ? item.simpleData[0] === undefined ||
//                       (item.simpleData[0].package[0]
//                         ? item.simpleData[0].package.map((pck, index) => {
//                             if (pck.selected) {
//                               if (pck.selling_price) {
//                                 if (+pck.packetmrp > +pck.selling_price) {
//                                   return pck.packetmrp;
//                                 }
//                               }
//                             } else if (showFirstPriceOnLoad && index === 0) {
//                               if (pck.selling_price) {
//                                 if (+pck.packetmrp > +pck.selling_price) {
//                                   return pck.packetmrp;
//                                 }
//                               }
//                             }
//                           })
//                         : item.simpleData[0].RegionSellingPrice &&
//                           +item.simpleData[0].mrp > +item.simpleData[0].RegionSellingPrice &&
//                           item.simpleData[0].mrp)
//                     : ""}
//                 </span>
//               </span>
//               {item.sameDayDelivery === false ? <span className="next_day_delivery">Next day delivery only</span> : <></>}
//             </div>
//             <Link to={"/product/" + item.slug}>
//               <div className="product-list-name capitalise">{item.product_name}</div>
//               {reviewRatingShow && item.ratings ? (
//                 <div className="homepage-rating">
//                   <Rating
//                     emptySymbol="fa fa-star-o fa-2x"
//                     fullSymbol="fa fa-star fa-2x"
//                     fractions={2}
//                     readonly={true}
//                     initialRating={item.ratings || 0}
//                   />

//                   <p> ({item.reviewsCount || 0})</p>
//                 </div>
//               ) : (
//                 <div className="homepage-rating"></div>
//               )}
//             </Link>
//             <div className={item.TypeOfProduct === "simple" ? "product-card-add simple" : "product-card-add config"}>
//               {item.TypeOfProduct === "simple" ? (
//                 <span className="card-button">
//                   {+quantityshow === 0 ? (
//                     ""
//                   ) : (
//                     <span className="label-icon add_to_cart_primary_icon" onClick={() => subtractFromCart(item)}>
//                       {+quantityshow === 1 ? <i className="fa fa-trash" aria-hidden="true"></i> : <i className="fa fa-minus" aria-hidden="true"></i>}
//                     </span>
//                   )}
//                   <span className="label-add">
//                     <span className={item.simpleData[0].package.length > 0 ? "text-add select-edit-tag" : "text-add norml-selet"}>
//                       <div
//                         className="custom-select"
//                         style={{
//                           background: "#f3f3f3",
//                           lineHeight: "36px",
//                         }}
//                       >
//                         {item.simpleData[0] === undefined ||
//                           (item.simpleData[0].package[0] ? (
//                             <select className="custom-select-form" id={item.simpleData[0]._id} onChange={handleChange} value={selPck[0]?._id}>
//                               {item.simpleData[0].package.map((pck) => {
//                                 return (
//                                   pck.status &&
//                                   pck.userPrice && (
//                                     <option value={pck._id}>
//                                       {pck.packetLabel}
//                                       {pck.quantity > 0 ? " - " + pck.quantity + " Qty" : ""}
//                                     </option>
//                                   )
//                                 );
//                               })}
//                             </select>
//                           ) : (
//                             <p style={{ textTransform: "capitalize" }}>
//                               {item.unitQuantity ? item.unitQuantity : 1} {item.unitMeasurement && item.unitMeasurement.name}
//                               {item.simpleData[0].userQuantity > 0 ? ` - ${item.simpleData[0].userQuantity} Qty` : ""}
//                             </p>
//                           ))}
//                       </div>
//                     </span>
//                     <span className="product-overlay"></span>
//                   </span>
//                   {item.outOfStock ? (
//                     <span className="label-icon add_to_cart_primary_icon" onClick={() => showOutofstockAlert(item)}>
//                       <i className="fa fa-plus" aria-hidden="true"></i>
//                       <span className="icon-overlay"></span>
//                     </span>
//                   ) : (
//                     <span className="label-icon add_to_cart_primary_icon" onClick={() => addToCart1()}>
//                       <i className="fa fa-plus" aria-hidden="true"></i>
//                       <span className="icon-overlay"></span>
//                     </span>
//                   )}
//                 </span>
//               ) : (
//                 <div>
//                   <span className="card-button" style={{ cursor: "pointer" }}>
//                     <span
//                       className="label-add"
//                       onClick={() => {
//                         setaddddd(false);
//                         setOpenGroupProduct(true);
//                       }}
//                     >
//                       <span className="text-add">View Detail</span>
//                       <span className="product-overlay"></span>
//                     </span>
//                     <span
//                       className="label-icon"
//                       onClick={() => {
//                         setaddddd(true);
//                         setOpenGroupProduct(true);
//                       }}
//                     >
//                       <i className="fa fa-plus" aria-hidden="true"></i>
//                       <span className="icon-overlay"></span>
//                     </span>
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       ) : item.TypeOfProduct === "configurable" ? (
//         <div className={item.outOfStock || item.preOrder === true ? "product-list-col out-of-stock-product" : "product-list-col"} key={item._id}>
//           <div className="product-thumb">
//             <Link to={"/product-configured/" + item.slug}>
//               {item.images && item.images.length > 0 ? (
//                 <img src={imageUrl + item.images[0].image} alt="primary" />
//               ) : (
//                 <img src={imageUrl + localStorage.getItem("prdImg")} alt="dummy" />
//               )}
//             </Link>
//           </div>
//           <div className="product-list-description">
//             <Link to={"/product-configured/" + item.slug}>
//               <div className="product-list-name capitalise">{item.product_name}</div>
//             </Link>
//             <div className={item.TypeOfProduct === "simple" ? "product-card-add simple" : "product-card-add config"}>
//               {item.TypeOfProduct === "configurable" ? (
//                 <div>
//                   <Link to={"/product-configured/" + item.slug}>
//                     <span className="card-button px-2" style={{ cursor: "pointer" }}>
//                       <span className="label-add">
//                         <span className="text-add">View Detail</span>
//                         <span className="product-overlay"></span>
//                       </span>
//                       <span className="label-icon">
//                         <i className="fa fa-plus" aria-hidden="true"></i>
//                         <span className="icon-overlay"></span>
//                       </span>
//                     </span>
//                   </Link>
//                 </div>
//               ) : (
//                 ""
//               )}
//             </div>
//           </div>
//         </div>
//       ) : (
//         ""
//       )}
//     </>
//   );
// }

// const mapStateToProps = (state) => ({
//   ...state,
// });

// const mapDispatchToProps = (dispatch) => ({
//   addToCart: (data) => dispatch(addToCart(data)),
//   quantityChange: (data) => dispatch(quantityChange(data)),
//   userdetails: (data) => dispatch(userdetails(data)),
// });

// export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ProductCard));


import moment from "moment";
import { useEffect, useState } from "react";
import Rating from "react-rating";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import { addToCart, quantityChange, userdetails } from "../../../src/redux/actions/actions";
import { ApiRequest } from "../../apiServices/ApiRequest";
import { imageUrl } from "../../imageUrl";
import GroupProduct from "../Group/Group_Product";
import sendCartDataToAPI from "../sendCartDataToAPI";
import RegionPopup from "../RegionPopup";

function ProductCard({
  productData,
  cartItemQuantity,
  quantityChange,
  dataInCart,
  addToCart,
  user_details,
  changeSubscribeTrue,
  reviewRatingShow,
  index,
}) {
  const [item, setItem] = useState(productData);
  const [selPck, setSelPck] = useState([]);
  const [quantityshow, setQuantityshow] = useState(0);
  const [openGroupProduct, setOpenGroupProduct] = useState(false);
  const [showFirstPriceOnLoad, setShowFirstPriceOnLoad] = useState(true);
  const [price, setPrice] = useState(0);
  const [addddd, setaddddd] = useState(false);
  const [Popup, setPopup] = useState(false);


  useEffect(() => {
    setItem(productData);
  }, []);

  //adding selected property and quantity to each product
  useEffect(() => {
    let itm = item;
    if (showFirstPriceOnLoad) {
      let price = 0;
      let priceIndex;
      if (itm.TypeOfProduct === "simple") {
        itm.simpleData[0] === undefined ||
          (itm.simpleData[0].package[0] &&
            itm.simpleData[0].package.forEach((pck, inde) => {
              if (!price) {
                if (user_details.length !== 0) {
                  if (user_details.user_type === "b2b") {
                    console.log(itm.product_name + "  " + pck.B2B_price);
                    price = pck.B2B_price || 0;
                  } else if (user_details.user_type === "retail") {
                    price = pck.Retail_price || 0;
                  } else if (user_details.user_type === "user") {
                    price = pck.selling_price || 0;
                  }
                }
                if (price) {
                  priceIndex = inde;
                }
              }
            }));
      }
      if (itm.simpleData[0] && itm.simpleData[0].package.length > 0) {
        itm.simpleData[0].package.map((pck, index) => {
          let userPrice = 0;
          console.log(user_details);
          if (user_details.length !== 0) {
            if (user_details.user_type === "b2b") {
              userPrice = pck.B2B_price || 0;
            } else if (user_details.user_type === "retail") {
              userPrice = pck.Retail_price || 0;
            } else {
              userPrice = pck.selling_price || 0;
            }
          } else {
            userPrice = pck.selling_price || 0;
          }
          if (pck.quantity) {
          } else {
            pck.quantity = 0;
          }
          pck.userPrice = userPrice;
          if (priceIndex) {
            if (index === priceIndex) {
              pck.selected = true;
            } else {
              pck.selected = false;
            }
          } else {
            if (index === 0) {
              pck.selected = true;
            } else {
              pck.selected = false;
            }
          }
        });
      }
    }
    let cartData = [];
    let dataInCart1 = dataInCart ? [...dataInCart] : [];
    //looping throught cart and pushing them in cartData array with its packages quantity and normal quantity
    dataInCart1.forEach((item) => {
      var quantity = 0;
      var selectedPck = [];
      if (item.TypeOfProduct === "simple") {
        if (item.TypeOfProduct === "simple" && item.simpleData[0].package.length > 0) {
          item.simpleData[0].package.forEach((pck) => {
            if (pck.selected) {
              selectedPck.push(pck);
            }
          });
        } else {
          quantity = item.simpleData[0].userQuantity;
        }
      }
      if (cartData.length > 0) {
        if (
          cartData.filter((i) => {
            return i._id === item._id;
          }).length > 0
        ) {
          let modified = cartData.map((cartItem) => {
            if (cartItem._id === item._id) {
              return {
                ...cartItem,
                packages: cartItem.packages.concat(selectedPck),
              };
            } else {
              return cartItem;
            }
          });
          cartData = modified;
        } else {
          cartData.push({
            _id: item._id,
            withoutpackagequantity: quantity,
            packages: selectedPck,
          });
        }
      } else {
        cartData.push({
          _id: item._id,
          withoutpackagequantity: quantity,
          packages: selectedPck,
        });
      }
    });

    //looping thorught all products and adding quantity to each product from cart
    if (cartData.length > 0) {
      if (
        cartData.filter((i) => {
          return i._id === itm._id;
        }).length > 0
      ) {
        cartData.map((cartItem) => {
          if (cartItem._id === itm._id) {
            if (itm.simpleData && itm.simpleData[0]) {
              itm.simpleData[0].package[0]
                ? itm.simpleData[0].package.map((pck, index) => {
                    if (cartItem.packages.filter((c) => c._id === pck._id).length > 0) {
                      cartItem.packages.map((cartPck) => {
                        if (pck._id === cartPck._id && pck.packet_size === cartPck.packet_size) {
                          return (pck.quantity = cartPck.quantity);
                        }
                      });
                    } else {
                      return (pck.quantity = 0);
                    }
                  })
                : (itm.simpleData[0].userQuantity = cartItem.withoutpackagequantity);

              if (itm.simpleData[0].package.filter((a) => a.selected).length === 0) {
                itm.simpleData[0].package.map((a, i) => (i === 0 ? (a.selected = true) : (a.selected = false)));
              }
            }
          } else {
            if (itm.simpleData && itm.simpleData[0]) {
              if (itm.simpleData[0].package[0]) {
                let selectedOne = itm.simpleData[0].package.filter((a) => a.selected);
                itm.simpleData[0].package.map((pck, index) => {
                  if (pck.quantity) {
                  } else {
                    pck.quantity = 0;
                  }
                });
                if (selectedOne.length === 0 || !selectedOne) {
                  itm.simpleData[0].package.map((pck, index) => {
                    if (index === 0) {
                      pck.selected = true;
                    } else {
                      pck.selected = false;
                    }
                  });
                }
              } else {
                itm.simpleData[0].userQuantity = 0;
              }
            }
          }
        });
      } else {
        if (itm.simpleData && itm.simpleData[0]) {
          if (itm.simpleData[0].package[0]) {
            let selectedOne = itm.simpleData[0].package.filter((a) => a.selected);
            itm.simpleData[0].package.map((pck, index) => {
              if (pck.quantity) {
                pck.quantity = 0; //added for updation
              } else {
                pck.quantity = 0;
              }
            });
            if (selectedOne.length === 0 || !selectedOne) {
              itm.simpleData[0].package.map((pck, index) => {
                if (index === 0) {
                  pck.selected = true;
                } else {
                  pck.selected = false;
                }
              });
            }
          } else {
            itm.simpleData[0].userQuantity = 0;
          }
        }
      }
    } else {
      if (itm.simpleData && itm.simpleData[0]) {
        if (itm.simpleData[0].package[0]) {
          let selectedOne = itm.simpleData[0].package.filter((a) => a.selected);
          itm.simpleData[0].package.map((pck, index) => {
            if (pck.quantity) {
              pck.quantity = 0; //added for upadtion
            } else {
              pck.quantity = 0;
            }
          });
          if (selectedOne.length === 0 || !selectedOne) {
            itm.simpleData[0].package.map((pck, index) => {
              if (index === 0) {
                pck.selected = true;
              } else {
                pck.selected = false;
              }
            });
          }
        } else {
          itm.simpleData[0].userQuantity = 0;
        }
      }
    }
  }, [item, cartItemQuantity]);

  //calculating price of product and setting quantityshow
  useEffect(() => {
    let price1 = price;
    if (item.TypeOfProduct === "simple") {
      // console.log(item?.simpleData, "item?.simpleDataitem?.simpleDataitem?.simpleDataitem?.simpleData");
      if (item?.simpleData.length > 0) {
        if (item.simpleData[0].package[0]) {
          item.simpleData[0].package.map((pck, index) => {
            if (pck.selected) {
              setQuantityshow(pck.quantity);
              if (user_details.length !== 0) {
                if (user_details.user_type === "b2b") {
                  price1 = pck.B2B_price;
                } else if (user_details.user_type === "retail") {
                  price1 = pck.Retail_price;
                } else if (user_details.user_type === "user" || user_details.user_type === null) {
                  price1 = pck.selling_price;
                }
              } else {
                if (pck.selling_price) {
                  price1 = pck.selling_price;
                } else {
                  price1 = pck.packetmrp;
                }
              }
            } else if (showFirstPriceOnLoad && index === 0) {
              setQuantityshow(pck.quantity);
              if (user_details.length !== 0) {
                if (user_details.user_type === "b2b") {
                  price1 = pck.B2B_price;
                } else if (user_details.user_type === "retail") {
                  price1 = pck.Retail_price;
                } else if (user_details.user_type === "user" || user_details.user_type === null) {
                  price1 = pck.selling_price;
                }
              } else {
                if (pck.selling_price) {
                  price1 = pck.selling_price;
                } else {
                  price1 = pck.packetmrp;
                }
              }
            }
          });
        } else {
          setQuantityshow(item.simpleData[0].userQuantity);
          if (user_details.length !== 0) {
            if (user_details.user_type === "b2b") {
              price1 = item.simpleData[0].RegionB2BPrice;
            } else if (user_details.user_type === "retail") {
              price1 = item.simpleData[0].RegionRetailPrice;
            } else if (user_details.user_type === "user") {
              price1 = item.simpleData[0].RegionSellingPrice;
            } else if (user_details.user_type === null) {
              price1 = item.simpleData[0].RegionSellingPrice;
            } else {
            }
          } else {
            if (item.simpleData[0].RegionSellingPrice) {
              price1 = item.simpleData[0].RegionSellingPrice;
            } else {
              price1 = item.simpleData[0].mrp;
            }
          }
        }
      }
    }
    setSelPck(item.simpleData[0] && item.simpleData[0].package.length > 0 ? item.simpleData[0].package.filter((a) => a.selected) : []);
    setPrice(price1);
  }, [cartItemQuantity]);

  //handle package selection change
  const handleChange = (e) => {
    const selectedPackageId = e.target.value;
    const id = e.target.id;
    setShowFirstPriceOnLoad(false);
    let price1 = price;

    let itm = item;
    //making selected value false of previously selected item
    if (itm.simpleData[0]) {
      if (itm.simpleData[0]._id === id) {
        itm.simpleData[0].package.map((pck) => {
          pck.selected = false;
        });
      }
    }

    //adding value true to selected item
    if (itm.simpleData[0]) {
      if (itm.simpleData[0]._id === id) {
        itm.simpleData[0].package.map((pck) => {
          if (pck._id === selectedPackageId) {
            pck.selected = true;
            setSelPck(pck);

            setQuantityshow(pck.quantity);
            if (user_details.length !== 0) {
              if (user_details.user_type === "b2b") {
                price1 = pck.B2B_price;
              } else if (user_details.user_type === "retail") {
                price1 = pck.Retail_price;
              } else if (user_details.user_type === "user" || user_details.user_type === null) {
                price1 = pck.selling_price;
              }
            } else {
              if (pck.selling_price) {
                price1 = pck.selling_price;
              } else {
                price1 = pck.packetmrp;
              }
            }
          }
        });
      }
    }
    setPrice(price1);
  };

  //adding cart added products in cartItem State
  const addToCart1 = async (selectedItem = item) => {
    if(localStorage.getItem("TempRegion") == "true"){
      console.log("localStorage.getItem")
      setPopup(true)
      return
    }
    var already_cart = false;
    var realTimeCart = localStorage.getItem("cartItem") ? JSON.parse(localStorage.getItem("cartItem")) : [];
    var quantityInCart = 0;
    let errorPresent = false;
    let selectedItmPck = selectedItem.simpleData[0].package.length > 0 ? selectedItem.simpleData[0].package.filter((pck) => pck.selected) : "";

    //adding 1 quantity first time in without package products
    if (!selectedItem.simpleData[0].userQuantity) {
      selectedItem.simpleData[0].userQuantity = 1;
    }
    let availableLocalQuantity = selectedItem.simpleData[0].availableQuantity;
    let name = selectedItem.product_name;

    var cartSelectedPck = [];
    if (realTimeCart.length > 0) {
      realTimeCart.map((itm) => {
        if (itm._id === selectedItem._id) {
          if (itm.simpleData[0].package[0]) {
            itm.simpleData[0].package.map((i) => {
              if (i.selected) {
                cartSelectedPck.push(i._id);
                quantityInCart = i.quantity;
              }
            });
          } else {
            quantityInCart = itm.simpleData[0].userQuantity;
          }
        }
      });

      if (selectedItem.simpleData[0].package[0]) {
        selectedItem.simpleData[0].package.map((sId) => {
          if (sId.selected) {
            if (
              cartSelectedPck.filter((i) => {
                return i === sId._id;
              }).length > 0
            ) {
              already_cart = true;
              let quantityError = false;
              selectedItem.simpleData[0].package.map((itmitm, indind) => {
                if (itmitm.selected === true) {
                  availableLocalQuantity = +availableLocalQuantity / +itmitm.packet_size;
                  if (+availableLocalQuantity >= +selectedItem.simpleData[0].package[indind].quantity + 1) {
                    selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity + 1;
                  } else {
                    quantityError = true;
                    errorPresent = true;
                    swal({
                      title: "Error!",
                      text:
                        "You can not add " +
                        name +
                        " more than " +
                        selectedItem.simpleData[0]?.availableQuantity +
                        " " +
                        selectedItem.unitMeasurement?.name,
                      icon: "warning",
                    });
                  }
                }
              });
              realTimeCart.map((itm) => {
                if (itm._id === selectedItem._id) {
                  itm.simpleData[0].package.map((pck) => {
                    if (pck.selected) {
                      if (pck._id === selectedItmPck[0]._id && !quantityError) {
                        return (pck.quantity = pck.quantity + 1);
                      }
                    }
                  });
                }
              });
              addToCart([]);
              localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
              addToCart(realTimeCart);
            } else {
              addToCart([]);
              selectedItem.simpleData[0].package.map((itmitm, indind) => {
                const productQu = +selectedItem.simpleData[0].package[indind].quantity;
                availableLocalQuantity = +availableLocalQuantity / +itmitm.packet_size;
                if (itmitm.selected === true && +availableLocalQuantity >= productQu + 1) {
                  selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity + 1;
                }
                if (itmitm.selected === true && +availableLocalQuantity < productQu + 1) {
                  swal({
                    title: "Error!",
                    text:
                      "You can not add" +
                      name +
                      " more than " +
                      selectedItem.simpleData[0]?.availableQuantity +
                      " " +
                      selectedItem.unitMeasurement?.name,
                    icon: "warning",
                  });
                  errorPresent = true;
                }
              });
              if (!errorPresent) {
                realTimeCart.push(selectedItem);
              }
              localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
              addToCart(realTimeCart);
            }
          }
        });
      } else {
        if (
          realTimeCart.filter((i) => {
            return i._id === selectedItem._id;
          }).length > 0
        ) {
          already_cart = true;
          realTimeCart.map((itm) => {
            if (itm._id === selectedItem._id) {
              return availableLocalQuantity > itm.simpleData[0].userQuantity
                ? (itm.simpleData[0].userQuantity = quantityInCart + 1)
                : (itm.simpleData[0].userQuantity = quantityInCart);
            }
          });
          if (+availableLocalQuantity >= +selectedItem.simpleData[0].userQuantity + 1) {
            selectedItem.simpleData[0].userQuantity = quantityInCart + 1;
          } else {
            errorPresent = true;
            swal({
              title: "Error!",
              text:
                "You can not add " + name + " more than " + selectedItem.simpleData[0]?.availableQuantity + " " + selectedItem.unitMeasurement?.name,
              icon: "warning",
            });
          }
          addToCart([]);
          localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
          addToCart(realTimeCart);
        } else {
          already_cart = false;
          addToCart([]);
          realTimeCart.push(selectedItem);
          localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
          addToCart(realTimeCart);
        }
      }
    } else {
      already_cart = false;
      selectedItem.simpleData[0].package.map((itmitm, indind) => {
        if (itmitm.selected === true) {
          availableLocalQuantity = +availableLocalQuantity / +itmitm.packet_size;
          if (+availableLocalQuantity >= +selectedItem.simpleData[0].package[indind].quantity + 1) {
            selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity + 1;
          } else {
            errorPresent = true;
            swal({
              title: "Error!",
              text:
                "You can not add " + name + " more than " + selectedItem.simpleData[0]?.availableQuantity + " " + selectedItem.unitMeasurement?.name,
              icon: "warning",
            });
          }
        }
      });
      if (!errorPresent) {
        addToCart([]);
        realTimeCart.push(selectedItem);
        localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
        addToCart(realTimeCart);
      }
    }

    if (!errorPresent) {
      setQuantityshow((prv) => prv + 1);
      await sendCartDataToAPI([selectedItem], user_details, addToCart)
        .then((res) => {
          if (selectedItem.preOrder === true && realTimeCart.length === 1 && already_cart === false) {
            swal({
              title: "Pre-ordering produce?",
              text: "You will only be able to see products available for delivery on the same day as the pre-order product.",
              icon: "warning",
              dangerMode: true,
              buttons: {
                confirm: {
                  text: "Go ahead",
                  value: true,
                  visible: true,
                  className: "",
                  closeModal: true,
                },
                cancel: {
                  text: "Go back",
                  value: false,
                  visible: true,
                  className: "back-swal-btn",
                  closeModal: true,
                },
              },
            }).then((confirm) => {
              if (confirm) {
                localStorage.setItem("status", true);
                if (changeSubscribeTrue) {
                  changeSubscribeTrue();
                }
              } else {
                newarrayofcart = newarrayofcart ? newarrayofcart.filter((itm) => itm._id !== selectedItem._id) : [];
                localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
                addToCart([]);
                addToCart(newarrayofcart);
                addToCart([]);
                quantityChange(!cartItemQuantity);
              }
            });
          }

          if (res.data.data === "you can not add both item") {
            swal({
              title: "Pre-ordering produce?",
              text: "You will only be able to see products available for delivery on the same day as the pre-order product and your current cart will get empty.",
              icon: "warning",
              dangerMode: true,
              buttons: {
                confirm: {
                  text: "Go ahead",
                  value: true,
                  visible: true,
                  className: "",
                  closeModal: true,
                },
                cancel: {
                  text: "Go back",
                  value: false,
                  visible: true,
                  className: "back-swal-btn",
                  closeModal: true,
                },
              },
            }).then((confirm) => {
              if (confirm) {
                let emptyarray = [];
                localStorage.setItem("status", true);
                changeSubscribeToggleAPI(true);
                localStorage.setItem("cartItem", JSON.stringify(emptyarray));
                addToCart([]);
                localStorage.setItem("cartItem", JSON.stringify([selectedItem]));
                addToCart([selectedItem]);
                if (changeSubscribeTrue) {
                  changeSubscribeTrue();
                }
                quantityChange(!cartItemQuantity);
              } else {
                var newarrayofcart = realTimeCart;
                newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
                localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
                addToCart([]);
                addToCart(newarrayofcart);
                quantityChange(!cartItemQuantity);
              }
            });
          } else if (res.data.data === "you can order one preorder product at a time.") {
            const preorderItemsInCart = realTimeCart.filter((a) => a.preOrder);
            if (selectedItem._id === preorderItemsInCart[0]._id) {
            } else {
              swal({
                title: "Pre-ordering produce?",
                text: "You can only order one pre-order product at a time.",
                icon: "warning",
                dangerMode: true,
                buttons: {
                  // confirm: {
                  //   text: "Go ahead",
                  //   value: true,
                  //   visible: true,
                  //   className: "",
                  //   closeModal: true,
                  // },
                  cancel: {
                    text: "Ok",
                    value: false,
                    visible: true,
                    className: "back-swal-btn",
                    closeModal: true,
                  },
                },
              }).then((confirm) => {
                if (confirm) {
                  let emptyarray = [];
                  localStorage.setItem("status", true);
                  changeSubscribeToggleAPI(true);
                  localStorage.setItem("cartItem", JSON.stringify(emptyarray));
                  addToCart([]);
                  addToCart([]);
                  localStorage.setItem("cartItem", JSON.stringify([selectedItem]));
                  addToCart([selectedItem]);

                  if (changeSubscribeTrue) {
                    changeSubscribeTrue();
                  }

                  quantityChange(!cartItemQuantity);
                } else {
                  var newarrayofcart = realTimeCart;
                  newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
                  localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
                  addToCart([]);
                  addToCart(newarrayofcart);

                  quantityChange(!cartItemQuantity);
                }
              });
            }
          } else if (res.data.result === "user_id Required") {
            var newarrayofcart = realTimeCart;
            var checkingarraypoping = realTimeCart;
            checkingarraypoping = checkingarraypoping.filter((itm) => itm._id !== selectedItem._id);
            // checkingarraypoping.splice(checkingarraypoping.length,1);
            var checkingarray = [];
            checkingarray = checkingarraypoping;

            if (JSON.parse(localStorage.getItem("status")) == true) {
              for (var j = 0; j < checkingarray.length; j++) {
                if (checkingarray[j].preOrder === selectedItem.preOrder && selectedItem.preOrder === true) {
                  newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
                  localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
                  addToCart([]);
                  addToCart(newarrayofcart);

                  swal({
                    title: "Pre-ordering produce?",
                    text: "You can only order one pre-order product at a time.",
                    icon: "warning",
                    dangerMode: true,
                    buttons: {
                      cancel: {
                        text: "Ok",
                        value: false,
                        visible: true,
                        className: "back-swal-btn",
                        closeModal: true,
                      },
                      // cancel: {
                      //   text: "Ok",
                      //   value: false,
                      //   visible: true,
                      //   className: "back-swal-btn",
                      //   closeModal: true,
                      // },
                    },
                  }).then((confirm) => {
                    if (confirm) {
                    }
                  });
                } else if (checkingarray[j] && selectedItem.preOrder === true) {
                  swal({
                    title: "Pre-ordering produce?",
                    text: "You will only be able to see products available for delivery on the same day as the pre-order product.",
                    icon: "warning",
                    dangerMode: true,
                  });
                }
              }
            } else {
              for (var i = 0; i < checkingarray.length; i++) {
                if (checkingarray[i].preOrder === selectedItem.preOrder && selectedItem.preOrder === true) {
                  newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
                  localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
                  addToCart(newarrayofcart);

                  swal({
                    title: "Pre-ordering produce?",
                    text: "You can only order one pre-order product at a time.",
                    icon: "warning",
                    dangerMode: true,
                    buttons: {
                      cancel: {
                        text: "Ok",
                        value: false,
                        visible: true,
                        className: "back-swal-btn",
                        closeModal: true,
                      },
                      // cancel: {
                      //   text: "Ok",
                      //   value: false,
                      //   visible: true,
                      //   className: "back-swal-btn",
                      //   closeModal: true,
                      // },
                    },
                  }).then((confirm) => {
                    if (confirm) {
                    }
                  });
                } else if (checkingarray[i] && selectedItem.preOrder === true) {
                  swal({
                    title: "Pre-ordering produce?",
                    text: "You will only be able to see products available for delivery on the same day as the pre-order product and your current cart will get empty.",
                    icon: "warning",
                    dangerMode: true,
                    buttons: {
                      confirm: {
                        text: "Go ahead",
                        value: true,
                        visible: true,
                        className: "",
                        closeModal: true,
                      },
                      cancel: {
                        text: "Go back",
                        value: false,
                        visible: true,
                        className: "back-swal-btn",
                        closeModal: true,
                      },
                    },
                  }).then((confirm) => {
                    if (confirm) {
                      let emptyarray = [];
                      localStorage.setItem("status", true);
                      changeSubscribeToggleAPI(true);
                      localStorage.setItem("cartItem", JSON.stringify(emptyarray));
                      addToCart([]);
                      // window.location = "/product/" + selectedItem.product_name;
                      if (changeSubscribeTrue) {
                        changeSubscribeTrue();
                      }
                      addToCart([]);
                      localStorage.setItem("cartItem", JSON.stringify([selectedItem]));
                      addToCart([selectedItem]);
                    } else {
                      newarrayofcart = newarrayofcart.filter((itm) => itm._id !== selectedItem._id);
                      localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
                      addToCart([]);
                      addToCart(newarrayofcart);
                    }
                  });
                }
              }
            }
          } else if (res.data.message === "errror") {
            swal({
              title: "Error!",
              text: "You can not add " + res.data.data.join(""),
              icon: "warning",
              dangerMode: true,
            });
            var newarrayofcart = realTimeCart;
            let webPck;
            newarrayofcart = newarrayofcart.filter((itm) => {
              let cartP = itm.TypeOfProduct === "simple" ? itm.simpleData[0].package.filter((c) => c.selected) : [];
              webPck = selectedItem.simpleData[0].package.filter((a) => a.selected);
              console.log(cartP[0]?._id, webPck[0]._id, cartP[0]?._id !== webPck[0]._id);
              if (itm._id !== selectedItem._id) {
                return itm;
              } else {
                if (cartP[0]?._id !== webPck[0]._id) {
                  return itm;
                }
              }
            });
            localStorage.setItem("cartItem", JSON.stringify(newarrayofcart));
            addToCart([]);
            addToCart(newarrayofcart);
            setTimeout(() => {
              let itm = item;
              if (itm._id === selectedItem._id) {
                //looping thorught all products and adding quantity to each product from cart
                if (itm.simpleData && itm.simpleData[0]) {
                  itm.simpleData[0].package[0]
                    ? itm.simpleData[0].package.map((pck, index) => {
                        if (pck._id === webPck[0]._id) {
                          pck.quantity = quantityInCart > 0 ? quantityInCart : 0;
                        }
                        if (quantityInCart === 0) {
                          if (pck._id === webPck[0]._id) {
                            pck.selected = true;
                          } else {
                            pck.selected = false;
                          }
                        }
                      })
                    : (itm.simpleData[0].userQuantity = 0);
                }
              }
            }, 0);
            quantityChange(!cartItemQuantity);
          } else {
          }
        })
        .catch((error) => {
          console.log(error);
        });

      localStorage.setItem("coupon_code", "");
      localStorage.setItem("freepackage", "");
      localStorage.setItem("freeproduct", "");
      localStorage.setItem("couponStatus", 2);
      localStorage.setItem("discount_amount", "");
    }
  };

  //subtracting from cart
  const subtractFromCart = async (selectedItem = item) => {
    // setLoading(true);
    var already_cart = false;
    var quantityInCart = 0;
    let modifiedSelectedItem;
    var realTimeCart = localStorage.getItem("cartItem") ? JSON.parse(localStorage.getItem("cartItem")) : [];
    let selectedItmPck = selectedItem.simpleData[0].package.length > 0 ? selectedItem.simpleData[0].package.filter((pck) => pck.selected) : "";
    var cartSelectedPck = [];
    if (realTimeCart.length > 0) {
      realTimeCart.map((itm) => {
        if (itm._id === selectedItem._id) {
          if (itm.simpleData[0].package[0]) {
            itm.simpleData[0].package.map((i) => {
              if (i.selected) {
                cartSelectedPck.push(i._id);
                quantityInCart = i.quantity;
              }
            });
          } else {
            quantityInCart = itm.simpleData[0].userQuantity;
          }
        }
      });

      if (selectedItem.simpleData[0].package[0]) {
        selectedItem.simpleData[0].package.map((itmitm, indind) => {
          if (itmitm.selected === true) {
            selectedItem.simpleData[0].package[indind].quantity = itmitm.quantity - 1;
          }
        });
        selectedItem.simpleData[0].package.map((sId) => {
          if (sId.selected) {
            if (
              cartSelectedPck.filter((i) => {
                return i === sId._id;
              }).length > 0
            ) {
              already_cart = true;
              if (quantityInCart <= 1) {
                // deleting item from cart if quantity is 1.
                realTimeCart = realTimeCart.filter((itm) => {
                  if (itm._id === selectedItem._id) {
                    if (itm.simpleData[0].package.length > 0) {
                      let samePackageProduct = false;
                      itm.simpleData[0].package.map((pck) => {
                        if (pck.selected) {
                          if (pck._id === selectedItmPck[0]._id) {
                            samePackageProduct = true;
                          } else {
                          }
                        }
                      });
                      if (!samePackageProduct) {
                        return itm;
                      } else {
                        return;
                      }
                    } else {
                      return itm;
                    }
                  } else {
                    return itm;
                  }
                });
              } else {
                //subtracting 1 quantity from selected item in cart.
                realTimeCart.map((itm) => {
                  if (itm._id === selectedItem._id) {
                    itm.simpleData[0].package.map((pck) => {
                      if (pck.selected) {
                        if (pck._id === selectedItmPck[0]._id) {
                          return (pck.quantity = pck.quantity - 1);
                        }
                      }
                    });
                  }
                });
              }
              addToCart([]);
              localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
              addToCart(realTimeCart);
            } else {
              let name = selectedItem.product_name;
              swal({
                // title: ,
                text: "Please add " + name + "  in your cart",
                icon: "warning",
                dangerMode: true,
              });
            }
          }
        });
      } else {
        if (
          realTimeCart.filter((i) => {
            return i._id === selectedItem._id;
          }).length > 0
        ) {
          already_cart = true;
          if (quantityInCart <= 1) {
            realTimeCart = realTimeCart.filter((itm) => itm._id !== selectedItem._id);
          } else {
            realTimeCart.map((itm) => {
              if (itm._id === selectedItem._id) {
                return (itm.simpleData[0].userQuantity = quantityInCart - 1);
              }
            });
          }
          addToCart([]);
          localStorage.setItem("cartItem", JSON.stringify(realTimeCart));
          addToCart(realTimeCart);
        } else {
          already_cart = false;

          let name = selectedItem.product_name;
          swal({
            // title: ,
            text: "Please add " + name + "  in your cart",
            icon: "warning",
            dangerMode: true,
          });
        }
      }
    } else {
      already_cart = false;
      let name = selectedItem.product_name;
      swal({
        // title: ,
        text: "Please add " + name + "  in your cart",
        icon: "warning",
        dangerMode: true,
      });
    }

    setQuantityshow((prv) => prv - 1);
    await sendCartDataToAPI([selectedItem], user_details, addToCart)
      .then((res) => {
        // setLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const changeSubscribeToggleAPI = (status) => {
    let requestData = {
      _id: user_details._id,
      subscribeToggle: status,
    };
    ApiRequest(requestData, "/subscribe/toggle/status", "POST")
      .then((res) => {})
      .catch((error) => {
        console.log(error);
      });
  };

  const showOutofstockAlert = (item) => {
    swal({
      // title: ,
      text: item.product_name + " is currently out of stock",
      icon: "warning",
      dangerMode: true,
    });
  };
  const selectedRegionValue = (value, name) => {
    localStorage.setItem("selectedRegionId", JSON.stringify(value));
    localStorage.setItem("selectedRegionName", JSON.stringify(name));
    
    setPopup("false")
    localStorage.setItem("TempRegion","false")
    // this.props.history.push("/");
    window.location.reload();
  };
  return (
    <>
    {Popup ? (
        <RegionPopup
        selectedRegionValue={(v, n) => selectedRegionValue(v, n)}
        closePopup={() => {
            setPopup(false);
            // closeRegionPopup();
          }}
          parentName="home"
        />
      ) : (
        ""
      )}
      {openGroupProduct ? <GroupProduct addddd={addddd} closeGroup={() => setOpenGroupProduct(false)} groupProductData={item} /> : ""}
      {price || item.TypeOfProduct === "group" ? (
        <div className={item.outOfStock || item.preOrder || (item.TypeOfProduct === "simple" && item.simpleData[0].package.sort((a,b)=>a.packet_size - b.packet_size)[0].packet_size > item.availableQuantity) || (item.TypeOfProduct === "group" && item.groupData[0].sets.filter((cur)=>cur.product.outOfStock)[0]?.product?.outOfStock)? "product-list-col out-of-stock-product" : "product-list-col"} key={item._id}>
          {item.preOrder ? (
            <p className="stocke-text-pre">
              <span className="pre-order" style={{ display: "inline-block" }}>
                PRE-ORDER FOR <br />
                {item.preOrderEndDate ? moment(item.preOrderEndDate).format("DD/MM/YYYY") : ""}
              </span>
            </p>
          ) : (
            item.outOfStock && <p className="stocke-text">Out Of Stock</p>
          //  <p className="stocke-text">Out Of Stock</p>
          )}
          {/* {
            item.TypeOfProduct === "simple" ? item.simpleData[0].package.sort((a,b)=>a.packet_size - b.packet_size)[0].packet_size > item.availableQuantity && <p className="stocke-text">Out Of Stock</p> : ""
          } */}
          {
            item.TypeOfProduct === "simple" ? item.simpleData[0].package.sort((a,b)=>a.packet_size - b.packet_size)[0].packet_size > item.availableQuantity && (item.outOfStock = true) : ""
          }
          {
            item.TypeOfProduct === "group" && item?.base_price? item.groupData[0].sets.filter((cur)=>cur.product.outOfStock)[0]?.product?.outOfStock && (item.outOfStock = true): ""
          }
           {/* out of stock for those group products in which multiple sets are available and in either set all products are out of stock */}
          {
            item.TypeOfProduct === "group" ? item.groupData.filter((cudData)=> cudData.sets.filter((cur)=>cur.product.outOfStock).length == cudData.sets.length).length > 0 && (item.outOfStock = true) : ""
          }
          <div className="product-thumb">
            {item.images && item.images.length > 0 ? (
              <Link to={"/product/" + item.slug}>
                {" "}
                <img src={imageUrl + item.images[0].image} alt="primary" />
              </Link>
            ) : (
              <img src={imageUrl + localStorage.getItem("prdImg")} alt="dummy" />
            )}
          </div>
          <div className="product-list-description">
            <div className="product-list-price">
              <span className="price-product">
                {item.TypeOfProduct === "simple" ? "₹ " + price : ""}
                {item.TypeOfProduct === "group" && item?.base_price ? "₹ " + item?.base_price : ""}
                {item.TypeOfProduct === "group" && item?.base_price  && item?.group_mrp ? <span className="old-price">₹{item?.group_mrp} </span>: ""}
                <span className="old-price">
                  {item.TypeOfProduct === "simple"
                    ? item.simpleData[0] === undefined ||
                      (item.simpleData[0].package[0]
                        ? item.simpleData[0].package.map((pck, index) => {
                            if (pck.selected) {
                              if (pck.selling_price) {
                                if (+pck.packetmrp > +pck.selling_price) {
                                  return pck.packetmrp;
                                }
                              }
                            } else if (showFirstPriceOnLoad && index === 0) {
                              if (pck.selling_price) {
                                if (+pck.packetmrp > +pck.selling_price) {
                                  return pck.packetmrp;
                                }
                              }
                            }
                          })
                        : item.simpleData[0].RegionSellingPrice &&
                          +item.simpleData[0].mrp > +item.simpleData[0].RegionSellingPrice &&
                          item.simpleData[0].mrp)
                    : ""}
                </span>
              </span>
              {item.sameDayDelivery === false ? <span className="next_day_delivery">Next day delivery only</span> : <></>}
            </div>
            <Link to={"/product/" + item.slug}>
              <div className="product-list-name capitalise">{item.product_name}</div>
              {reviewRatingShow && item.ratings ? (
                <div className="homepage-rating">
                  <Rating
                    emptySymbol="fa fa-star-o fa-2x"
                    fullSymbol="fa fa-star fa-2x"
                    fractions={2}
                    readonly={true}
                    initialRating={item.ratings || 0}
                  />

                  <p> ({item.reviewsCount || 0})</p>
                </div>
              ) : (
                <div className="homepage-rating"></div>
              )}
            </Link>
            <div className={item.TypeOfProduct === "simple" ? "product-card-add simple" : "product-card-add config"}>
              {item.TypeOfProduct === "simple" ? (
                <span className="card-button">
                  {+quantityshow === 0 ? (
                    ""
                  ) : (
                    <span className="label-icon add_to_cart_primary_icon" onClick={() => subtractFromCart(item)}>
                      {+quantityshow === 1 ? <i className="fa fa-trash" aria-hidden="true"></i> : <i className="fa fa-minus" aria-hidden="true"></i>}
                    </span>
                  )}
                  <span className="label-add">
                    <span className={item.simpleData[0].package.length > 0 ? "text-add select-edit-tag" : "text-add norml-selet"}>
                      <div
                        className="custom-select"
                        style={{
                          background: "#f3f3f3",
                          lineHeight: "36px",
                        }}
                      >
                        {item.simpleData[0] === undefined ||
                          (item.simpleData[0].package[0] ? (
                            <select className="custom-select-form" id={item.simpleData[0]._id} onChange={handleChange} value={selPck[0]?._id}>
                              {item.simpleData[0].package.map((pck) => {
                                return (
                                  pck.status &&
                                  pck.userPrice && (
                                    <option value={pck._id}>
                                      {pck.packetLabel}
                                      {pck.quantity > 0 ? " - " + pck.quantity + " Qty" : ""}
                                    </option>
                                  )
                                );
                              })}
                            </select>
                          ) : (
                            <p style={{ textTransform: "capitalize" }}>
                              {item.unitQuantity ? item.unitQuantity : 1} {item.unitMeasurement && item.unitMeasurement.name}
                              {item.simpleData[0].userQuantity > 0 ? ` - ${item.simpleData[0].userQuantity} Qty` : ""}
                            </p>
                          ))}
                      </div>
                    </span>
                    <span className="product-overlay"></span>
                  </span>
                  {item.outOfStock ? (
                    <span className="label-icon add_to_cart_primary_icon" onClick={() => showOutofstockAlert(item)}>
                      <i className="fa fa-plus" aria-hidden="true"></i>
                      <span className="icon-overlay"></span>
                    </span>
                  ) : (
                    <span className="label-icon add_to_cart_primary_icon" onClick={() => addToCart1()}>
                      <i className="fa fa-plus" aria-hidden="true"></i>
                      <span className="icon-overlay"></span>
                    </span>
                  )}
                </span>
              ) : (
                <div>
                  <span className="card-button" style={{ cursor: "pointer" }}>
                    <span
                      className="label-add"
                      onClick={() => {
                        if(localStorage.getItem("TempRegion") == "true"){
                          setPopup(true)
                        } else {
                          setaddddd(false);
                          setOpenGroupProduct(true);
                        }
                        
                      }}
                    >
                      <span className="text-add">View Detail</span>
                      <span className="product-overlay"></span>
                    </span>
                    <span
                      className="label-icon"
                      onClick={() => {
                        if(localStorage.getItem("TempRegion") == "true"){
                          setPopup(true)
                        } else {
                          setaddddd(false);
                          setOpenGroupProduct(true);
                        }
                      }}
                    >
                      <i className="fa fa-plus" aria-hidden="true"></i>
                      <span className="icon-overlay"></span>
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : item.TypeOfProduct === "configurable" ? (
        <div className={item.outOfStock || item.preOrder === true ? "product-list-col out-of-stock-product" : "product-list-col"} key={item._id}>
          <div className="product-thumb">
            <Link to={"/product-configured/" + item.slug}>
              {item.images && item.images.length > 0 ? (
                <img src={imageUrl + item.images[0].image} alt="primary" />
              ) : (
                <img src={imageUrl + localStorage.getItem("prdImg")} alt="dummy" />
              )}
            </Link>
          </div>
          <div className="product-list-description">
            <Link to={"/product-configured/" + item.slug}>
            <span className="price-product">
              {item.configurableData.length == 1 ? "₹ " + item.configurableData[0].selling_price: "₹ " + item.configurableData.sort((a,b)=>a.selling_price - b.selling_price)[0].selling_price + " - " + "₹ " + item.configurableData.sort((a,b)=>b.selling_price - a.selling_price)[0].selling_price}
            </span>
              <div className="product-list-name capitalise">{item.product_name}</div>
            </Link>
            
            <div className={item.TypeOfProduct === "simple" ? "product-card-add simple" : "product-card-add config"} style={{display:item.TypeOfProduct === "configurable" && "none"}}>
              {item.TypeOfProduct === "configurable" ? (
                <div>
                  <Link to={"/product-configured/" + item.slug}>
                    <span className="card-button px-2" style={{ cursor: "pointer" }}>
                      <span className="label-add">
                        <span className="text-add">View Detail</span>
                        <span className="product-overlay"></span>
                      </span>
                      <span className="label-icon">
                        <i className="fa fa-plus" aria-hidden="true"></i>
                        <span className="icon-overlay"></span>
                      </span>
                    </span>
                  </Link>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
}

const mapStateToProps = (state) => ({
  ...state,
});

const mapDispatchToProps = (dispatch) => ({
  addToCart: (data) => dispatch(addToCart(data)),
  quantityChange: (data) => dispatch(quantityChange(data)),
  userdetails: (data) => dispatch(userdetails(data)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ProductCard));
