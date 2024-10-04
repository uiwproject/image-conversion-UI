import React, { useState, useEffect, useRef } from "react";
import { FaCloudUploadAlt, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { deeparteffects_api_key, photoroom_api_key } from "../utils/credentials";
import ProgressBar from "./progressBar/ProgressBar";
import WarningModal from "./WarningModal";
import GeneratedImage from "./GeneratedImage";
import './css/ImageConversion.css'
import { url } from "../utils/url";
import SelectComponent from "./selectField/SelectComponent";


const ImageConversion = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [loaderDots, setLoaderDots] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [styles, setStyles] = useState([]);
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [resultData, setResultData] = useState(null);
    const scrollRef = useRef(null);
    const [imageBase64Encoded, setImageBase64Encoded] = useState(null)
    const [warningText, setWarningText] = useState(null)
    const [isWarningModalOpen, setWarningModalOpen] = useState(false);
    const [isGenerateClickedBefore, setGenerateClickedBefore] = useState(false)
    const [isEndReached, setEndReach] = useState({
        left: true,
        right: false
    })
    const [checkBoxState, setCheckBoxState] = useState({
        useOriginalColors: false,
        removeBackground: false,
    });
    const [selectedQuality, setSelectedQuality] = useState('');
    const [imageFile, setImageFile] = useState(null)

    const quotes = [
        "Transforming your photo... even Picasso would be impressed!",
        "Hold on! We're making your memory look legendary!",
        "Your masterpiece is brewing… just a few more seconds!",
        "Patience, please! Your wearable art is being created with care",
        "Working hard... your design is almost runway-ready",
        "Your art is coming! We promise it's worth the wait",
        "Good things take time... and this is going to be great",
        "Turning your precious memory into something beautiful"
    ];


    useEffect(() => {
        const handleScroll = () => {
            // console.log("hit scroll");

            if (scrollRef.current.scrollLeft === 0) {
                // console.log("end hit left");
                setEndReach((pre) => ({ ...pre, left: true }))
            } else if (scrollRef.current.scrollLeft === (scrollRef.current.scrollWidth - scrollRef.current.clientWidth)) {
                // console.log("end hit right");
                setEndReach((pre) => ({ ...pre, right: true }))
            } else {

                setEndReach({
                    left: false,
                    right: false
                })
            }
        };

        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (scrollElement) {
                scrollElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    useEffect(() => {
        fetchStyles();
    }, [])

    useEffect(() => {
        let interval1;
        let interval2;

        if (isGenerating || styles.length === 0) {
            interval1 = setInterval(() => {
                setLoaderDots((prev) => (prev.length < 3 ? prev + "." : ""));
            }, 500);
            interval2 = setInterval(() => {
                setQuoteIndex((prev) => (prev + 1) % quotes.length);
            }, 2000);
        } else {
            clearInterval(interval1);
            clearInterval(interval2);
        }

        return () => {
            clearInterval(interval1);
            clearInterval(interval2);
        };
    }, [isGenerating, styles]);

    const fetchStyles = async () => {
        try {
            const response = await fetch("https://api.deeparteffects.com/v1/noauth/styles", {
                method: 'GET',
                headers: {
                    "x-api-key": deeparteffects_api_key
                }
            });

            if (response.ok) {
                const data = await response.json();
                const preferedStyles = ["Mosaic 2", "Ukiyo-e", "Yira", "Pointillism 2", "Sketch 1", "Sketch 2", "Sketch 3",
                    "Abstract 5", "Abstract 7", "Abstract 8", "Manga", "Mudita", "Comic", "a1a2bc77"
                ];
                const filteredData = data.styles.filter((style) => preferedStyles.includes(style.title));
                setStyles(filteredData);
            }
        } catch (error) {
            console.log("error on fetchStyles", error);
        }
    };

    const handleQualityChange = (event) => {
        setSelectedQuality(event.target.value);
    };

    const fetchResult = async (submissionId) => {
        // console.log("Received submissionId:", submissionId);

        if (!submissionId) {
            console.error("No submissionId provided.");
            return;
        }

        try {
            const response = await fetch(`https://api.deeparteffects.com/v1/noauth/result?submissionId=${submissionId}`, {
                method: 'GET',
                headers: {
                    "x-api-key": deeparteffects_api_key
                }
            });

            if (response.ok) {
                const data = await response.json();
                // console.log("Fetched Result Data:", data);
                return data;
            } else {
                console.error("Failed to fetch result. Status:", response.status);
            }
        } catch (error) {
            console.log("Error fetching result:", error);
        }
    };

    const delay = (t) => setTimeout(() => { }, t)

    const handleGenerate = async () => {
        warningText && setWarningText(null);
        warningText && await delay(1000);

        if (!imageBase64Encoded || !selectedImage) {
            return setWarningText("Please select an image to generate image");
        } else if (!selectedStyle || !selectedStyle?.id) {
            return setWarningText("Please select a style to generate image");
        }

        setResultData(null);
        setIsGenerating(true);
        setLoaderDots("");

        let finalImageBase64 = imageBase64Encoded;

        try {
            const response = await fetch("https://api.deeparteffects.com/v1/noauth/upload", {
                method: 'POST',
                headers: {
                    "x-api-key": deeparteffects_api_key,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    styleId: selectedStyle.id,
                    imageBase64Encoded: finalImageBase64,
                    imageSize: 4096,
                    optimizeForPrint: true,
                    useOriginalColors: String(checkBoxState.useOriginalColors),
                })
            });

            // console.log("data of handleGenerate before....", response);

            if (response.ok) {
                const data = await response.json();

                // console.log("data of upload api", data);


                const pollForResult = async (submissionId) => {
                    const fetchResultData = await fetchResult(submissionId);

                    // console.log("fetchResultData", fetchResultData);
                    if (fetchResultData && fetchResultData.status === "finished") {


                        if (checkBoxState.removeBackground) {
                            const imageURL = fetchResultData.url;
                            // console.log("Image URL for background removal: ", imageURL);

                            const imageResponse = await fetch(`${url}/proxy?imageURL=${imageURL}`);

                            if (!imageResponse.ok) {
                                throw new Error('Failed to fetch image for background removal');
                            }

                            const imageBlob = await imageResponse.blob();

                            // console.log("imageBlob", imageBlob);

                            const imageFile = new File([imageBlob], 'image.jpg', { type: 'image/jpeg' });

                            const bgFormData = new FormData();
                            bgFormData.append('image_file', imageFile);
                            bgFormData.append('crop', true);

                            const bgResponse = await fetch('https://sdk.photoroom.com/v1/segment', {
                                method: 'POST',
                                headers: {
                                    'X-Api-Key': photoroom_api_key
                                },
                                body: bgFormData
                            });

                            if (!bgResponse.ok) {
                                const errorData = await bgResponse.json();
                                throw new Error(`Background removal network response was not ok: ${JSON.stringify(errorData)}`);
                            }

                            const resizedBlob = await bgResponse.blob();

                            // console.log("resizedBlob", resizedBlob);

                            const blobUrl = URL.createObjectURL(resizedBlob);

                            // console.log("blobUrl", blobUrl);


                            setResultData({ ...fetchResultData, url: blobUrl, isBlob: true });
                            setIsGenerating(false);
                        } else {
                            setResultData({ ...fetchResultData, isBlob: false });
                            setIsGenerating(false);
                        }

                    }
                    else {
                        setTimeout(() => pollForResult(submissionId), 2000);
                    }
                };

                pollForResult(data.submissionId);
            }

        } catch (error) {
            console.log("error", error);
        }
    };



    // const handleImageUpload = async (event) => {
    //     warningText && setWarningText(null)
    //     const file = event.target.files[0];
    //     if (file) {

    //         if (!file.type.startsWith('image/')) {
    //             setWarningText('Please upload a valid image file.');
    //             return;
    //         }
    //         setImageFile(file)

    //         const reader = new FileReader();
    //         reader.onload = () => {
    //             setSelectedImage(reader.result);
    //             const base64String = reader.result.replace("data:", "").replace(/^.+,/, "");
    //             // console.log("base64String", base64String);

    //             setImageBase64Encoded(base64String)
    //         };
    //         reader.readAsDataURL(file);
    //     }
    // };

    const handleImageUpload = async (event) => {
        warningText && setWarningText(null);
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setWarningText('Please upload a valid image file.');
                return;
            }
            setImageFile(file);

            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const maxImageSize = 2048;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxImageSize) {
                            height = Math.round((height * maxImageSize) / width);
                            width = maxImageSize;
                        }
                    } else {
                        if (height > maxImageSize) {
                            width = Math.round((width * maxImageSize) / height);
                            height = maxImageSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);

                    const resizedImageUrl = canvas.toDataURL('image/jpeg', 1.0);

                    setSelectedImage(resizedImageUrl);

                    const base64String = resizedImageUrl.replace("data:image/jpeg;base64,", "");
                    setImageBase64Encoded(base64String);
                };
            };
            reader.readAsDataURL(file);
        }
    };



    const handleCheckboxChange = (event) => {
        const { id, checked } = event.target;
        setCheckBoxState((prevState) => ({
            ...prevState,
            [id]: checked,
        }));
    };

    const handleDeleteImage = () => {
        setSelectedImage(null);
        setImageBase64Encoded(null)
    };

    const handleCancelImage = () => {
        setResultData(null)
    }


    const scrollLeft = () => {

        if (scrollRef.current) {
            scrollRef.current.scrollLeft -= 100;
        }
    };

    const scrollRight = () => {

        if (scrollRef.current) {
            scrollRef.current.scrollLeft += 100;
        }
    };

    const handleSelectStyle = (data) => {
        // console.log("data handleSelectStyle", data);
        warningText && setWarningText(null)

        if (selectedStyle && selectedStyle?.id === data?.id) {
            return setSelectedStyle(null)
        }

        setSelectedStyle(data)
    }

    const generateRandomString = (length) => {
        const charset = 'ABCDEFGHIJ-KLMNOPQRSTUVW-XYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            result += charset[randomIndex];
        }
        return result;
    };

    const handleDownloadImage = async () => {
        try {
            let response;
            let blob;
            if (!resultData.isBlob) {
                // console.log("hit not blob");
                response = await fetch(`${url}/proxy?imageURL=${resultData?.url}`);
                blob = await response.blob();
            }

            // console.log("response handleDownloadImage", response);

            const randomString = generateRandomString(8);
            const filename = `${randomString}_UIW.jpg`;

            const link = document.createElement("a");
            link.href = resultData.isBlob ? resultData.url : URL.createObjectURL(blob);
            link.setAttribute("download", filename);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading the image:', error);
        }
    };



    const openModal = () => {
        setWarningModalOpen(true);
    };

    const closeModal = () => {
        setWarningModalOpen(false);
    };

    return (
        <div className="image-conversion-container">
            <h2 className="image-conversion-title">
                Create Your Custom Design
            </h2>
            <p className="image-conversion-subTitle">Turn your Beautiful Memories into Art: Upload your picture, select your style, and click generate.</p>
            <div className="content-wrapper">
                <div className="content-wrapper2">
                    <div
                        className={selectedImage ? "image-upload-container-with-image" : "image-upload-container-no-image"}
                    // style={{
                    //     width: "100%",
                    //     maxWidth: selectedImage ? "53rem" : "42rem",
                    //     height: selectedImage ? "30rem" : "18rem",
                    //     margin: "auto",
                    //     border: "2px dashed #ccc",
                    //     display: "flex",                                  // for deploy
                    //     alignItems: "center",
                    //     justifyContent: "center",
                    //     backgroundColor: "#f8f8f8",
                    //     position: "relative",
                    //     cursor: "pointer",
                    //     borderRadius: "8px",
                    //     overflow: "hidden",
                    // }}
                    >
                        {selectedImage ? (
                            <img
                                src={selectedImage}
                                alt="Uploaded"
                                className="uploaded-image"
                            />
                        ) : (
                            <>
                                <input
                                    type="file"
                                    onChange={handleImageUpload}
                                    className="file-input"
                                />
                                <div className="upload-icon-container">
                                    <FaCloudUploadAlt size={40} color="#DAC1FF" />
                                    <p
                                        className="upload-text"
                                    // style={{
                                    //     marginTop: "10px",   // for dev
                                    //     // marginTop: "4px",  // for deploy
                                    //     color: '#DAC1FF'
                                    // }}
                                    >
                                        Upload image here.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>




                {warningText && (
                    <div
                        className="warning-container"
                    >
                        <p
                            className="warning-text"
                        >
                            {warningText}
                        </p>
                    </div>
                )}



                <div className="checkbox-container">
                    <label htmlFor="removeBackground" class="removeBackground-label">
                        <input
                            id="removeBackground"
                            type="checkbox"
                            checked={checkBoxState.removeBackground}
                            onChange={handleCheckboxChange}
                        />
                        <span id="checkbox-text">Remove background</span>
                    </label>
                    <label htmlFor="useOriginalColors">
                        <input
                            id="useOriginalColors"
                            type="checkbox"
                            checked={checkBoxState.useOriginalColors}
                            onChange={handleCheckboxChange}
                        />
                        <span id="checkbox-text">Use original colors</span>
                    </label>
                </div>

                <div className="select-quality-container">
                    <SelectComponent
                        handleChange={handleQualityChange}
                        selectedQuality={selectedQuality}
                    />
                </div>


                <div className="button-container">
                    <button
                        onClick={() => {
                            if (isGenerateClickedBefore) {
                                handleGenerate();
                            } else {
                                openModal();
                            }
                        }}
                        disabled={isGenerating}
                        className={`generate-button ${isGenerating ? 'disabled' : ''}`}
                    >
                        Generate
                    </button>
                    {selectedImage && (
                        <button
                            disabled={isGenerating}
                            className={`remove-button ${isGenerating ? 'disabled' : ''}`}
                            onClick={handleDeleteImage}
                        >
                            Remove
                        </button>
                    )}
                </div>


                {isGenerating && (
                    <div className="quote-parent">
                        <p className="quote">{quotes[quoteIndex]}</p>
                        <p className="generating-text">Generating your image{loaderDots}</p>
                        <ProgressBar />
                    </div>
                )}


                <div >
                    <div className="style-selection-container">
                        <h3 className="style-selection-text">Please select a style from below</h3>
                    </div>
                    <div className="scroll-wrapper">
                        <div className="scroll-container">
                            <button onClick={scrollLeft} className="scroll-button-left">
                                <FaAngleLeft
                                    size={40}
                                    color={isEndReached.left ? "rgb(240 234 250)" : "#DAC1FF"}
                                    style={{ cursor: isEndReached.left ? "not-allowed" : "pointer" }}
                                />
                            </button>
                            <div ref={scrollRef} className="style-list-container" style={{ ...(styles.length === 0 ? { justifyContent: 'center' } : {}) }}>


                                {styles.length > 0 ? styles.map((data) => (
                                    <div
                                        key={data.id}
                                        style={{
                                            border: selectedStyle?.id === data.id ? "2px solid #DAC1FF" : "none",
                                        }}
                                        className="style-item"
                                        onClick={() => handleSelectStyle(data)}
                                    >
                                        <img src={data.url} alt={data.title} className="style-image" />
                                        <p className="style-text">{data.title}</p>
                                    </div>
                                )) :

                                    <div className="loading-style-parent">
                                        <p className="loading-style-text">Loading styles{loaderDots}</p>
                                    </div>
                                }
                            </div>
                            <button onClick={scrollRight} className="scroll-button-right">
                                <FaAngleRight
                                    size={40}
                                    color={isEndReached.right ? "rgb(240 234 250)" : "#DAC1FF"}
                                    style={{ cursor: isEndReached.right ? "not-allowed" : "pointer" }}
                                />
                            </button>
                        </div>
                    </div>

                </div>

                <GeneratedImage resultData={resultData} handleDownloadImage={handleDownloadImage} handleCancelImage={handleCancelImage} />
            </div>
            <WarningModal isOpen={isWarningModalOpen} setGenerateClickedBefore={setGenerateClickedBefore} onClose={closeModal} handlePrimary={handleGenerate} />
        </div>
    );
};

export default ImageConversion;
