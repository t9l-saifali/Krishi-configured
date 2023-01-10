import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import ReactLoading from "react-loading";
import "react-pro-sidebar/dist/css/styles.css";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { addToCart, quantityChange, userdetails } from "../../src/redux/actions/actions";
import { ApiRequest } from "../apiServices/ApiRequest";
import { imageUrl } from "../imageUrl";
import GroupProduct from "./Group/Group_Product";
import ProductCard from "./ProductCard/ProductCard";
import RegionPopup from "./RegionPopup";
import swal from "sweetalert";
import { red } from "@material-ui/core/colors";

var previousCount = 0;
function Product({
  search,
  allFilterItems,
  showAll,
  showTopTenList,
  selectedReg,
  popupSelected,
  openRegionPopup,
  closeRegionPopup,
  subscription,
  finishLoading,
  changeSubscribeTrue,
  setCategoryData
}) {
  const [product, product_data] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [, setItemsLoaded] = useState(false);
  // const [cartItems, setCartItems] = useState(dataInCart ? dataInCart : []);
  const [regionId, setRegionId] = useState(localStorage.getItem("selectedRegionId") ? JSON.parse(localStorage.getItem("selectedRegionId")) : "");
  const [, setRegionName] = useState(localStorage.getItem("selectedRegionName") ? localStorage.getItem("selectedRegionName") : "");
  const [openPopup, setOpenPopup] = useState(openRegionPopup);
  const [renderProducts, setRenderProducts] = useState(false);
  const [openGroupProduct, setOpenGroupProduct] = useState(false);
  const [groupProductData, setGroupProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [storePos, setStorePos] = useState(false);
  const [count, setCount] = useState(0);
  const [featureProductId, setFeatureProductId] = useState("");
  const [reviewRatingShow, setReviewRatingShow] = useState(false);

  useEffect(() => {
    if (search.length === 0) {
      product_data(allProducts);
      if (previousCount !== 0) {
        setCount(previousCount);
        if (allProducts.length >= previousCount) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } else {
      product_data(search);
      previousCount = count;
      setTimeout(() => {
        setHasMore(false);
        setCount(0);
      }, 0);
    }
    setRenderProducts(!renderProducts);
  }, [search, allFilterItems]);

  useEffect(() => {
    setOpenPopup(openRegionPopup);
  }, [openRegionPopup]);

  //storing last scroll position in session
  useEffect(() => {
    const handleScroll = (e) => {
      // set scroll values in state
      if (storePos) {
        sessionStorage.setItem("lScrollPos", window.pageYOffset);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Remove listener when component unmounts
    return () => window.removeEventListener("scroll", handleScroll);
  });

  //checking in local storage if region exits and showing products accordingly
  useEffect(() => {
    if (localStorage.getItem("selectedRegionId") && localStorage.getItem("selectedRegionName")) {
      const localRegion = localStorage.getItem("selectedRegionId");
      const localRegionName = localStorage.getItem("selectedRegionName");
      if (localRegion !== null && localRegionName != null) {
        setRegionId(JSON.parse(localRegion));
        setOpenPopup(false);
      }
    }
    let requestData = {};
    ApiRequest(requestData, "/storehey/getSetting", "GET")
      .then((res) => {
        if (res.status !== 401 || res.status !== 400) {
          setReviewRatingShow(res.data.data[0].reviewRating);
        } else {
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (selectedReg && selectedReg.length > 0) {
      setRegionId(selectedReg);
    }
  }, [selectedReg]);

  useEffect(() => {
    product_data(allFilterItems);
    setTimeout(() => {
      setRenderProducts(!renderProducts);
    }, 10);
  }, [allFilterItems]);

  useEffect(() => {
    getAllProductsDataByRegion();
  }, [subscription]);
  //showing all products dfdfdf

  useEffect(() => {
    let catId;
    if (imageUrl.includes("kc.storehey.com")) {
      catId = "60bef11cad133434896d22a5";
    } else {
      catId = "60c2e902e00fd55ac258f3f9";
    }
    setCategoryData("hjjjjjjjjjjjjjjjjjjjjj")
    var path = window.location.pathname;
    var categoryName = path.split("/")[2];
    if(!categoryName && path.split("/")[1] == 'collection'){
      swal({
        title: "Collection Name missing",
        icon: "warning",
        dangerMode: true,
      });
      product_data([]);
      finishLoading(100);
    }
    let requestData = {
      product_categories: sessionStorage.getItem("catId") ? sessionStorage.getItem("catId") : catId,
      RegionId: JSON.parse(localStorage.getItem("selectedRegionId")),
      // subscribe: false,
      //written by saif because of product listning issue in subscribtion
      subscribe: localStorage.getItem("status") ? JSON.parse(localStorage.getItem("status")) : false,
      skip: 0,
      // limit: 3,
    };
    if(categoryName){
      requestData = {
        ...requestData,
        categoryName:categoryName
      }
    }
    if (localStorage.getItem("selectedRegionId")) {
      ApiRequest(requestData, "/searchProduct", "POST")
        .then((res) => {
          if (res.status === 201 || res.status === 200) {
            if (res.data.count !== 0) {
              product_data([]);
              product_data(res.data.data);
              setCount(res.data.count);
              finishLoading(100);
              window.scrollTo({
                top: +sessionStorage.getItem("lScrollPos"),
                behavior: "smooth",
              });
              setStorePos(true);
              if(res.data['categoryData']){
                setCategoryData(res.data['categoryData'])
              }
            } else {
              product_data([]);
              finishLoading(100);
            }
          } else {
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [showAll]);

  function getAllProductsDataByRegion() {
    let catId;
    if (imageUrl.includes("kc.storehey.com")) {
      catId = "60bef11cad133434896d22a5";
    } else {
      catId = "60c2e902e00fd55ac258f3f9";
    }
    var path = window.location.pathname;
    var categoryName = path.split("/")[2];
    let requestData = {
      product_categories: sessionStorage.getItem("catId") ? sessionStorage.getItem("catId") : catId,
      RegionId: regionId,
      subscribe: subscription,
      skip: 0,
      // limit: 3,
    };
    if(categoryName){
      requestData = {
        ...requestData,
        categoryName:categoryName
      }
    }
    if (regionId && regionId !== "") {
      ApiRequest(requestData, "/searchProduct", "POST")
        .then((res) => {
          if (res.status === 201 || res.status === 200) {
            if (res.data.count !== 0) {
              product_data([]);
              setAllProducts([]);
              setTimeout(() => {
                product_data(res.data.data);
                setAllProducts(res.data.data);
                setCount(res.data.count);
              }, 0);
              if(res.data['categoryData']){
                setCategoryData(res.data['categoryData'])
              }
            } else {
              product_data([]);
              setAllProducts([]);
              setCount(0);
            }
            finishLoading(100);
          }
        })
        .then(() => {
          setItemsLoaded(true);
          closeRegionPopup();
          finishLoading(100);
          window.scrollTo({
            top: +sessionStorage.getItem("lScrollPos"),
            behavior: "smooth",
          });
          setStorePos(true);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  //getting products according to region ID stored in localstorage
  useEffect(getAllProductsDataByRegion, []);

  useEffect(() => {
    popupSelected(regionId);
  }, [openPopup]);

  //getting products according to selected region id
  const selectedRegionValue = (value, name) => {
    setRegionId(value);
    setRegionName(name);
    let postRoute = localStorage.getItem('postRoute')
    if(postRoute != null){
          window.location = localStorage.getItem('postRoute')
          localStorage.setItem("postRoute", null)
        }
    let dta = {
      regionID: value,
      subscribe: localStorage.getItem("status") ? JSON.parse(localStorage.getItem("status")) : false,
    };
    
    ApiRequest(dta, "/GetCategorySubCat", "POST")
      .then((res) => {
        if (res.status === 201 || res.status === 200) {
          res.data.data.forEach((itm) => {
            let name = itm.category_name;
            name = name.toLowerCase();
            if (name === "featured products") {
              setFeatureProductId(itm._id);
            }
          });
        } else {
        }
      })
      .then(() => {
        const requestData = {
          RegionId: value,
          subscribe: false,
          product_categories: imageUrl.includes("kc.storehey.com") ? "60bef11cad133434896d22a5" : "60c2e902e00fd55ac258f3f9",
          skip: 0,
          // limit: 3,
        };
        if (value.length > 0) {
          ApiRequest(requestData, "/searchProduct", "POST")
            .then((res) => {
              if (res.status === 201 || res.status === 200) {
                if (res.data.count !== 0) {
                  product_data([]);
                  setAllProducts([]);
                  product_data(res.data.data);
                  setAllProducts(res.data.data);
                  setCount(res.data.count);
                } else {
                  product_data([]);
                  setAllProducts([]);
                }
                finishLoading(100);
                window.scrollTo({
                  top: +sessionStorage.getItem("lScrollPos"),
                  behavior: "smooth",
                });
                setStorePos(true);
              } else {
              }
            })
            .then(() => {
              setItemsLoaded(true);
              closeRegionPopup();
            })
            .catch((error) => {
              console.log(error);
            });
        }
      })
      .catch((error) => {
        console.log(error);
      });

    localStorage.setItem("selectedRegionId", JSON.stringify(value));
    localStorage.setItem("selectedRegionName", JSON.stringify(name));
  };

  //getting more products on scroll
  const fetchMoreProducts = () => {
    if (sessionStorage.getItem("catId")) {
    } else {
      if (product.length >= count && !showTopTenList) {
        setHasMore(false);
      } else {
        let catId = "";
        if (imageUrl.includes("kc.storehey.com")) {
          catId = "60bef11cad133434896d22a5";
        } else {
          catId = "60c2e902e00fd55ac258f3f9";
        }
        const requestData = {
          RegionId: regionId,
          subscribe: subscription,
          product_categories: sessionStorage.getItem("catId") ? sessionStorage.getItem("catId") : catId,
          skip: product.length,
          // limit: 3,
        };
        if (regionId.length > 0) {
          ApiRequest(requestData, "/searchProduct", "POST")
            .then((res) => {
              if (res.status === 201 || res.status === 200) {
                if (res.data.count !== 0) {
                  product_data(product.concat(res.data.data));
                  setCount(res.data.count);
                }
                finishLoading(100);
                window.scrollTo({
                  top: +sessionStorage.getItem("lScrollPos"),
                  behavior: "smooth",
                });
                setStorePos(true);
              } else {
              }
            })
            .catch((error) => {
              console.log(error);
            });
        }
      }
    }
  };
  return (
    <>
      {loading ? (
        <div className="homepage-loading">
          <ReactLoading type={"bubbles"} color={"#febc15"} height={"50px"} width={"100px"} />
        </div>
      ) : (
        ""
      )}
      {openPopup ? (
        <RegionPopup
          selectedRegionValue={selectedRegionValue}
          closePopup={() => {
            setOpenPopup(false);
            closeRegionPopup();
          }}
          parentName="home"
        />
      ) : (
        ""
      )}
      {openGroupProduct ? <GroupProduct closeGroup={() => setOpenGroupProduct(false)} groupProductData={groupProductData} /> : ""}
      {Array.isArray(product) && product.length > 0 ? (
        <InfiniteScroll dataLength={product.length} next={fetchMoreProducts} hasMore={hasMore}>
          <div className="product-list">
            {product.map((item, index) => (
              <ProductCard
                key={item._id}
                index={index}
                productData={item}
                changeSubscribeTrue={changeSubscribeTrue || false}
                reviewRatingShow={reviewRatingShow || false}
              />
            ))}
          </div>
        </InfiniteScroll>
      ) : (
        <>
          <img src={process.env.PUBLIC_URL + "/img/icons/no-product-found.jpg"} alt="" style={{ width: "100%" }} />
        </>
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Product));
