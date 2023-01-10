import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { ApiRequest } from "../../apiServices/ApiRequest";
import "../../assets/css/blog.css";
import { imageUrl } from "../../components/imgUrl";
import ProductCard from "../../components/ProductCard/ProductCard";
import { addToCart } from "../../redux/actions/actions";

var singleSlider = {
  dots: false,
  arrows: true,
  infinite: false,
  speed: 300,
  slidesToShow: 1,
  slidesToScroll: 1,
};
var feat_slider1 = {
  dots: true,
  arrows: true,
  infinite: false,
  speed: 300,
  slidesToShow: 3,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
        infinite: true,
        dots: true,
      },
    },
    {
      breakpoint: 767,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
      },
    },
  ],
};

function BlogDetails(props) {
  const [singleBlog, setSingleBlog] = useState({});
  const [youmayalsolike, setyoumayalsolike] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showFirstPriceOnLoad, setShowFirstPriceOnLoad] = useState(true);
  const [openCart, setOpenCart] = useState(true);
  const [pathName, setPathName] = useState(window.location.pathname);
  const [loading, setLoading] = useState(true);

  var path = props.location.pathname;
  var blogId = path.split("/")[2];

  useEffect(async () => {
    let requestData = {
      blog_id: blogId,
      RegionId: localStorage.getItem("selectedRegionId")
        ? JSON.parse(localStorage.getItem("selectedRegionId"))
        : "",
    };
    await ApiRequest(requestData, "/getOneBlog", "POST")
      .then((res) => {
        if (res.status === 201 || res.status === 200) {
          setyoumayalsolike(res.data.data.youmayalsolike);
          setSingleBlog(res.data.data);
          setRelatedProducts(res.data.data.relatedProduct);
        } else {
        }
      })
      .then(() => {
        setLoading(false);
      })
      .catch((err) => console.log(err));
    window.scrollTo(0, 0);
  }, [blogId]);

  return (
    <main className="page-content">
      <section className="page-banner" style={{ minHeight: "390px" }}>
        <div className="banner-figure">
          {!loading ? (
            singleBlog.banner ? (
              <img src={imageUrl + singleBlog.banner} alt="single blog" />
            ) : localStorage.getItem("banner") ? (
              <Skeleton count={5} />
            ) : (
              <Skeleton count={5} />
            )
          ) : (
            ""
          )}
        </div>
      </section>
      <div className="container">
        <div className="detail-ingredient-wrp">
          <div className="ing-de-top" style={{ maxHeight: "100%" }}>
            <div
              className="ing-figpro-slider"
              style={{ maxHeight: "100%", height: "auto" }}
            >
              <Slider {...singleSlider} style={{ maxHeight: "100%" }}>
                {singleBlog.images && singleBlog.images[0] ? (
                  singleBlog.images.map((img) => {
                    return <img src={imageUrl + img.image} alt="" />;
                  })
                ) : (
                  <Skeleton count={5} />
                )}
              </Slider>
              {/* <Slider {...feat_slider1}>	
                    <img src={imageUrl + singleBlog.image} />
                </Slider> */}
            </div>
          </div>
          <div className="ing-heading">
            <h4>{singleBlog.title}</h4>
            <div className="b-detail-intro">
              <div
                dangerouslySetInnerHTML={{ __html: singleBlog.description1 }}
              />
              {singleBlog.videoUrl?.includes("instagram") ? (
                ""
              ) : (
                <div className="detail-fig-b">
                  <div
                    dangerouslySetInnerHTML={{ __html: singleBlog.videoUrl }}
                  />
                </div>
              )}
              <p>
                <div
                  dangerouslySetInnerHTML={{ __html: singleBlog.description4 }}
                />
              </p>
            </div>
            <ul>
              {singleBlog.prepTime && <li>Prep Time: {singleBlog.prepTime}</li>}
              {singleBlog.noOfServe && <li>Serves: {singleBlog.noOfServe}</li>}
            </ul>
            {singleBlog.mediaLink ? (
              <a
                target="_blank"
                href={singleBlog.mediaLink}
                className="hide_button_blog"
                style={{ minWidth: 160, padding: 8 }}
              >
                <i className="far fa-play-circle"></i>
              </a>
            ) : (
              ""
            )}
          </div>
        </div>
        <div className="ingredient-detail-text">
          <div className="ing-detail-heading">
            <div
              dangerouslySetInnerHTML={{ __html: singleBlog.description2 }}
            />
          </div>
          <div className="in-bottom-wprer">
            <div
              dangerouslySetInnerHTML={{ __html: singleBlog.description3 }}
            />
          </div>
        </div>
      </div>
      <section className="detail-ingredient">
        <div className="container">
          {relatedProducts && relatedProducts.length > 0 && (
            <h5 className="inner-sub-heading">Ingredients available with us</h5>
          )}
          <div className="product-list-product">
            <Slider {...feat_slider1} className="res_slide ">
              {relatedProducts && relatedProducts.length > 0
                ? relatedProducts.map((item, ix) => {
                    return (
                      <ProductCard
                        key={ix}
                        index={ix}
                        productData={item.product_id}
                        // changeSubscribeTrue={changeSubscribeTrue || false}
                        reviewRatingShow={false}
                      />
                    );
                  })
                : ""}
            </Slider>
          </div>
        </div>
      </section>
      {youmayalsolike && youmayalsolike.length > 0 ? (
        <section className="b-featured">
          <div className="container">
            <div className="b--heading-box">
              <div className="b-text-left">
                <h5 className="b-heading">You may also like</h5>
              </div>
              <div className="b-text-right">
                <Link
                  to={
                    singleBlog && singleBlog.parentCat_id
                      ? "/recipe-category/" + singleBlog.parentCat_id[0].slug
                      : ""
                  }
                  // +
                  // ?
                  // : "featured%20recipes"
                >
                  view all
                </Link>
              </div>
            </div>

            <Slider {...feat_slider1}>
              {youmayalsolike &&
                youmayalsolike.map((blog) => {
                  return (
                    <div className="b-feat-col">
                      <div className="b-feat-fig">
                        <Link to={"/recipe/" + blog.slug}>
                          <img
                            style={{ maxWidth: "100%" }}
                            src={imageUrl + blog.images[0].image}
                            alt="image_you"
                          />
                        </Link>
                      </div>
                      <div className="b-feat-ctxt">
                        <h6 style={{ textTransform: "capitalize" }}>
                          <Link to={"/recipe/" + blog.slug}>{blog.title}</Link>
                        </h6>
                        <div className="tim-feat-b">
                          {blog.prepTime ? (
                            <div className="feat-top-b">
                              <span>Time</span>
                              <p>{blog.prepTime}</p>
                            </div>
                          ) : (
                            ""
                          )}
                          {blog.noOfServe ? (
                            <div className="feat-top-b-righ">
                              <span>Portion</span>
                              <p>{blog.noOfServe} Persons</p>
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </Slider>
          </div>
          <div></div>
        </section>
      ) : (
        ""
      )}
    </main>
  );
}
const mapStateToProps = (state) => ({
  ...state,
});

const mapDispatchToProps = (dispatch) => ({
  addToCart: (data) => dispatch(addToCart(data)),
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(BlogDetails)
);
