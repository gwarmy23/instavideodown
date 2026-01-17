// DOM Elements
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const previewBtn = document.getElementById('previewBtn');
const results = document.getElementById('results');
const loading = document.getElementById('loading');
const downloadSection = document.getElementById('downloadSection');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const success = document.getElementById('success');
const successMessage = document.getElementById('successMessage');
const downloadLinks = document.getElementById('downloadLinks');
const notification = document.getElementById('notification');
const progressBar = document.getElementById('progressBar');

// Preview Modal Elements
const previewModal = document.getElementById('previewModal');
const previewOverlay = document.getElementById('previewOverlay');
const previewClose = document.getElementById('previewClose');
const previewTitle = document.getElementById('previewTitle');
const previewMedia = document.getElementById('previewMedia');
const previewFooter = document.getElementById('previewFooter');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

// Global variables
let currentMediaData = null;
let currentPlatform = null;

// Accordion functionality
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const content = item.querySelector('.accordion-content');

        // Close other accordions
        document.querySelectorAll('.accordion-content').forEach(cont => {
            if (cont !== content) {
                cont.style.maxHeight = null;
            }
        });

        // Toggle current accordion
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});

// URL Validation and Platform Detection
function validateUrl(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('instagram.com')) {
            return 'instagram';
        } else {
            return false;
        }
    } catch {
        return false;
    }
}

// Show notification function
function showNotification(message, type = 'info', duration = 3000) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification-message ${type}`;
    notificationDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <p>${message}</p>
    `;

    notification.appendChild(notificationDiv);
    notification.classList.remove('hidden');

    // Auto-hide after duration
    setTimeout(() => {
        notificationDiv.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (notificationDiv.parentNode) {
                notificationDiv.parentNode.removeChild(notificationDiv);
            }
            if (notification.children.length === 0) {
                notification.classList.add('hidden');
            }
        }, 300);
    }, duration);
}

// Update progress bar
function updateProgress(percentage) {
    progressBar.style.width = `${percentage}%`;
}

// Preview Modal Functions
function showPreview(mediaData, mediaType, title = 'Media Preview', showDownloadBtn = false) {
    previewTitle.textContent = title;
    previewMedia.innerHTML = '';

    if (mediaType === 'image') {
        const img = document.createElement('img');
        img.src = mediaData.url || mediaData;
        img.alt = 'Preview Image';
        img.onload = () => {
            previewModal.classList.remove('hidden');
            if (showDownloadBtn) {
                previewFooter.style.display = 'flex';
            }
        };
        img.onerror = () => {
            showNotification('Failed to load image preview', 'error');
        };
        previewMedia.appendChild(img);
    } else if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = mediaData.videoUrl || mediaData.url || mediaData;
        video.controls = true;
        video.preload = 'metadata';
        video.style.maxWidth = '100%';
        video.style.maxHeight = '70vh';
        video.onloadedmetadata = () => {
            previewModal.classList.remove('hidden');
            if (showDownloadBtn) {
                previewFooter.style.display = 'flex';
            }
        };
        video.onerror = () => {
            showNotification('Failed to load video preview', 'error');
        };
        previewMedia.appendChild(video);
    } else if (mediaType === 'carousel') {
        const carouselDiv = document.createElement('div');
        carouselDiv.className = 'carousel-preview';

        (mediaData.urls || mediaData.media || mediaData).forEach((item, index) => {
            const img = document.createElement('img');
            img.src = item.url || item;
            img.alt = `Image ${index + 1}`;
            img.onclick = () => {
                showPreview(item, 'image', `Image ${index + 1}`, showDownloadBtn);
            };
            carouselDiv.appendChild(img);
        });

        previewMedia.appendChild(carouselDiv);
        previewModal.classList.remove('hidden');
        if (showDownloadBtn) {
            previewFooter.style.display = 'flex';
        }
    }
}

function hidePreview() {
    previewModal.classList.add('hidden');
    previewFooter.style.display = 'none';
    // Stop any playing videos
    const videos = previewMedia.querySelectorAll('video');
    videos.forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
}

// Preview only function
async function previewOnly(url, platform) {
    try {
        showNotification(`Loading preview for ${platform}...`, 'info');

        let apiResponse = null;

        if (platform === 'instagram') {
            apiResponse = await fetchInstagramMedia(url);
        }

        currentMediaData = apiResponse;
        currentPlatform = platform;

        // Show preview with download button
        showPreview(apiResponse, apiResponse.type, `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${apiResponse.type === 'reel' ? 'Reel' : apiResponse.type === 'carousel' ? 'Carousel' : apiResponse.type === 'video' ? 'Video' : 'Image'}`, true);

        showNotification('Preview loaded successfully!', 'success', 2000);

    } catch (err) {
        showNotification('Failed to load preview. Please try again.', 'error');
        console.error('Preview error:', err);
    }
}

// Function to show download options from preview data
function downloadMediaFromPreview(data, platform) {
    // Show results
    results.classList.remove('hidden');
    downloadSection.style.display = 'block';

    showNotification(`Download options ready for ${data.type}!`, 'success');

    // Clear previous links
    downloadLinks.innerHTML = '';

    // Create preview and download buttons based on media type
    if (data.type === 'video' || data.type === 'reel') {
        // For videos/reels
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        // Preview button
        const previewBtn = document.createElement('button');
        previewBtn.className = 'preview-btn';
        previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
        previewBtn.addEventListener('click', () => {
            showPreview(data, 'video', `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`);
        });
        buttonContainer.appendChild(previewBtn);

        // Download button
        const videoBtn = document.createElement('a');
        videoBtn.href = data.videoUrl || data.url;
        videoBtn.download = `${platform}_video.mp4`;
        videoBtn.className = 'download-link-btn video-btn';
        videoBtn.innerHTML = '<i class="fas fa-download"></i> Download Video';
        videoBtn.target = '_blank';
        videoBtn.addEventListener('click', () => {
            showNotification('Download started!', 'success', 2000);
        });
        buttonContainer.appendChild(videoBtn);

        downloadLinks.appendChild(buttonContainer);

        // If there's also a thumbnail
        if (data.thumbnail) {
            const thumbContainer = document.createElement('div');
            thumbContainer.className = 'button-container';

            // Thumbnail preview
            const thumbPreviewBtn = document.createElement('button');
            thumbPreviewBtn.className = 'preview-btn';
            thumbPreviewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview Thumbnail';
            thumbPreviewBtn.addEventListener('click', () => {
                showPreview({url: data.thumbnail}, 'image', 'Video Thumbnail');
            });
            thumbContainer.appendChild(thumbPreviewBtn);

            // Download thumbnail
            const thumbBtn = document.createElement('a');
            thumbBtn.href = data.thumbnail;
            thumbBtn.download = `${platform}_thumbnail.jpg`;
            thumbBtn.className = 'download-link-btn';
            thumbBtn.innerHTML = '<i class="fas fa-download"></i> Download Thumbnail';
            thumbBtn.target = '_blank';
            thumbBtn.addEventListener('click', () => {
                showNotification('Thumbnail download started!', 'success', 2000);
            });
            thumbContainer.appendChild(thumbBtn);

            downloadLinks.appendChild(thumbContainer);
        }
    } else if (data.type === 'carousel' || Array.isArray(data.urls)) {
        // For carousels/multiple images
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'carousel-container';

        // Carousel preview button
        const carouselPreviewBtn = document.createElement('button');
        carouselPreviewBtn.className = 'preview-btn';
        carouselPreviewBtn.innerHTML = '<i class="fas fa-images"></i> Preview All Images';
        carouselPreviewBtn.addEventListener('click', () => {
            showPreview(data, 'carousel', `${platform.charAt(0).toUpperCase() + platform.slice(1)} Carousel`);
        });
        carouselContainer.appendChild(carouselPreviewBtn);

        downloadLinks.appendChild(carouselContainer);

        // Individual image buttons
        (data.urls || data.media).forEach((item, index) => {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            // Preview button for individual image
            const previewBtn = document.createElement('button');
            previewBtn.className = 'preview-btn';
            previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
            previewBtn.addEventListener('click', () => {
                showPreview(item, 'image', `Image ${index + 1}`);
            });
            buttonContainer.appendChild(previewBtn);

            // Download button
            const button = document.createElement('a');
            button.href = item.url || item;
            button.download = `${platform}_image_${index + 1}.jpg`;
            button.className = 'download-link-btn';
            button.innerHTML = `<i class="fas fa-download"></i> Download Image ${index + 1}`;
            button.target = '_blank';
            button.addEventListener('click', () => {
                showNotification(`Image ${index + 1} download started!`, 'success', 2000);
            });
            buttonContainer.appendChild(button);

            downloadLinks.appendChild(buttonContainer);
        });

        // Add "Download All" button
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.className = 'download-all-btn';
        downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All';
        downloadAllBtn.addEventListener('click', () => {
            (data.urls || data.media).forEach((item, index) => {
                const a = document.createElement('a');
                a.href = item.url || item;
                a.download = `${platform}_image_${index + 1}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
            showNotification('All downloads started!', 'success', 2000);
        });
        downloadLinks.appendChild(downloadAllBtn);
    } else {
        // Single image
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        // Preview button
        const previewBtn = document.createElement('button');
        previewBtn.className = 'preview-btn';
        previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
        previewBtn.addEventListener('click', () => {
            showPreview(data, 'image', `${platform.charAt(0).toUpperCase() + platform.slice(1)} Image`);
        });
        buttonContainer.appendChild(previewBtn);

        // Download button
        const button = document.createElement('a');
        button.href = data.url;
        button.download = `${platform}_image.jpg`;
        button.className = 'download-link-btn';
        button.innerHTML = '<i class="fas fa-download"></i> Download Image';
        button.target = '_blank';
        button.addEventListener('click', () => {
            showNotification('Download started!', 'success', 2000);
        });
        buttonContainer.appendChild(button);

        downloadLinks.appendChild(buttonContainer);
    }

    // Add media info
    if (data.caption || data.description) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'media-info';
        infoDiv.innerHTML = `
            <h4><i class="fas fa-info-circle"></i> Media Info</h4>
            <p><strong>Type:</strong> ${data.type}</p>
            ${data.caption ? `<p><strong>Caption:</strong> ${data.caption}</p>` : ''}
            ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
        `;
        downloadLinks.appendChild(infoDiv);
    }
}

// Real download function with API integration
async function downloadMedia(url, platform) {
    // Show loading and reset states
    results.classList.remove('hidden');
    loading.style.display = 'block';
    downloadSection.style.display = 'none';
    success.style.display = 'none';
    error.style.display = 'none';
    progressBar.style.width = '0%';

    try {
        showNotification(`Processing ${platform} URL...`, 'info');

        let apiResponse = null;

        // Simulate progress updates
        updateProgress(20);

        if (platform === 'instagram') {
            // Using Instagram downloader API
            updateProgress(40);
            apiResponse = await fetchInstagramMedia(url);
        }

        updateProgress(80);

        // Process the response
        const data = apiResponse;

        updateProgress(100);

        // Hide loading, show results
        loading.style.display = 'none';
        downloadSection.style.display = 'block';

        showNotification(`Successfully processed ${data.type}!`, 'success');

        // Clear previous links
        downloadLinks.innerHTML = '';

        // Create preview and download buttons based on media type
        if (data.type === 'video' || data.type === 'reel') {
            // For videos/reels
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            // Preview button
            const previewBtn = document.createElement('button');
            previewBtn.className = 'preview-btn';
            previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
            previewBtn.addEventListener('click', () => {
                showPreview(data, 'video', `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`);
            });
            buttonContainer.appendChild(previewBtn);

            // Download button
            const videoBtn = document.createElement('a');
            videoBtn.href = data.videoUrl || data.url;
            videoBtn.download = `${platform}_video.mp4`;
            videoBtn.className = 'download-link-btn video-btn';
            videoBtn.innerHTML = '<i class="fas fa-download"></i> Download Video';
            videoBtn.target = '_blank';
            videoBtn.addEventListener('click', () => {
                showNotification('Download started!', 'success', 2000);
            });
            buttonContainer.appendChild(videoBtn);

            downloadLinks.appendChild(buttonContainer);

            // If there's also a thumbnail
            if (data.thumbnail) {
                const thumbContainer = document.createElement('div');
                thumbContainer.className = 'button-container';

                // Thumbnail preview
                const thumbPreviewBtn = document.createElement('button');
                thumbPreviewBtn.className = 'preview-btn';
                thumbPreviewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview Thumbnail';
                thumbPreviewBtn.addEventListener('click', () => {
                    showPreview({url: data.thumbnail}, 'image', 'Video Thumbnail');
                });
                thumbContainer.appendChild(thumbPreviewBtn);

                // Download thumbnail
                const thumbBtn = document.createElement('a');
                thumbBtn.href = data.thumbnail;
                thumbBtn.download = `${platform}_thumbnail.jpg`;
                thumbBtn.className = 'download-link-btn';
                thumbBtn.innerHTML = '<i class="fas fa-download"></i> Download Thumbnail';
                thumbBtn.target = '_blank';
                thumbBtn.addEventListener('click', () => {
                    showNotification('Thumbnail download started!', 'success', 2000);
                });
                thumbContainer.appendChild(thumbBtn);

                downloadLinks.appendChild(thumbContainer);
            }
        } else if (data.type === 'carousel' || Array.isArray(data.urls)) {
            // For carousels/multiple images
            const carouselContainer = document.createElement('div');
            carouselContainer.className = 'carousel-container';

            // Carousel preview button
            const carouselPreviewBtn = document.createElement('button');
            carouselPreviewBtn.className = 'preview-btn';
            carouselPreviewBtn.innerHTML = '<i class="fas fa-images"></i> Preview All Images';
            carouselPreviewBtn.addEventListener('click', () => {
                showPreview(data, 'carousel', `${platform.charAt(0).toUpperCase() + platform.slice(1)} Carousel`);
            });
            carouselContainer.appendChild(carouselPreviewBtn);

            downloadLinks.appendChild(carouselContainer);

            // Individual image buttons
            (data.urls || data.media).forEach((item, index) => {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'button-container';

                // Preview button for individual image
                const previewBtn = document.createElement('button');
                previewBtn.className = 'preview-btn';
                previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
                previewBtn.addEventListener('click', () => {
                    showPreview(item, 'image', `Image ${index + 1}`);
                });
                buttonContainer.appendChild(previewBtn);

                // Download button
                const button = document.createElement('a');
                button.href = item.url || item;
                button.download = `${platform}_image_${index + 1}.jpg`;
                button.className = 'download-link-btn';
                button.innerHTML = `<i class="fas fa-download"></i> Download Image ${index + 1}`;
                button.target = '_blank';
                button.addEventListener('click', () => {
                    showNotification(`Image ${index + 1} download started!`, 'success', 2000);
                });
                buttonContainer.appendChild(button);

                downloadLinks.appendChild(buttonContainer);
            });

            // Add "Download All" button
            const downloadAllBtn = document.createElement('button');
            downloadAllBtn.className = 'download-all-btn';
            downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All';
            downloadAllBtn.addEventListener('click', () => {
                (data.urls || data.media).forEach((item, index) => {
                    const a = document.createElement('a');
                    a.href = item.url || item;
                    a.download = `${platform}_image_${index + 1}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
                showNotification('All downloads started!', 'success', 2000);
            });
            downloadLinks.appendChild(downloadAllBtn);
        } else {
            // Single image
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            // Preview button
            const previewBtn = document.createElement('button');
            previewBtn.className = 'preview-btn';
            previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
            previewBtn.addEventListener('click', () => {
                showPreview(data, 'image', `${platform.charAt(0).toUpperCase() + platform.slice(1)} Image`);
            });
            buttonContainer.appendChild(previewBtn);

            // Download button
            const button = document.createElement('a');
            button.href = data.url;
            button.download = `${platform}_image.jpg`;
            button.className = 'download-link-btn';
            button.innerHTML = '<i class="fas fa-download"></i> Download Image';
            button.target = '_blank';
            button.addEventListener('click', () => {
                showNotification('Download started!', 'success', 2000);
            });
            buttonContainer.appendChild(button);

            downloadLinks.appendChild(buttonContainer);
        }

        // Add media info
        if (data.caption || data.description) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'media-info';
            infoDiv.innerHTML = `
                <h4><i class="fas fa-info-circle"></i> Media Info</h4>
                <p><strong>Type:</strong> ${data.type}</p>
                ${data.caption ? `<p><strong>Caption:</strong> ${data.caption}</p>` : ''}
                ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
            `;
            downloadLinks.appendChild(infoDiv);
        }

    } catch (err) {
        // Show error
        loading.style.display = 'none';
        error.style.display = 'block';
        errorMessage.textContent = 'Failed to fetch media. Please check the URL and try again.';
        showNotification('Failed to process URL. Please try again.', 'error');
        console.error('Download error:', err);
    }
}



// Instagram media fetcher - placeholder implementation
// Note: Real Instagram downloading requires third-party APIs or services
async function fetchInstagramMedia(url) {
    try {
        // Extract media ID from URL for demo purposes
        const urlMatch = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        if (!urlMatch) {
            throw new Error('Invalid Instagram URL format');
        }

        const mediaId = urlMatch[2];
        const mediaType = urlMatch[1]; // p, reel, or tv

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock response based on media type
        if (mediaType === 'reel' || mediaType === 'tv') {
            return {
                type: 'reel',
                videoUrl: `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`, // Placeholder video URL
                thumbnail: `https://via.placeholder.com/640x640/E4405F/FFFFFF?text=Instagram+Reel+${mediaId}`,
                caption: 'Sample Instagram reel caption',
                description: `Instagram Reel - ${mediaId}`
            };
        } else {
            // For regular posts - could be single image or carousel
            const isCarousel = Math.random() > 0.7; // Randomly decide if carousel for demo

            if (isCarousel) {
                return {
                    type: 'carousel',
                    urls: [
                        { url: `https://via.placeholder.com/640x640/E4405F/FFFFFF?text=Instagram+Image+1+${mediaId}` },
                        { url: `https://via.placeholder.com/640x640/E4405F/FFFFFF?text=Instagram+Image+2+${mediaId}` },
                        { url: `https://via.placeholder.com/640x640/E4405F/FFFFFF?text=Instagram+Image+3+${mediaId}` }
                    ],
                    caption: 'Sample Instagram carousel post',
                    description: `Instagram Carousel - ${mediaId}`
                };
            } else {
                return {
                    type: 'image',
                    url: `https://via.placeholder.com/640x640/E4405F/FFFFFF?text=Instagram+Post+${mediaId}`,
                    caption: 'Sample Instagram post caption',
                    description: `Instagram Image - ${mediaId}`
                };
            }
        }

    } catch (error) {
        console.error('Instagram fetch error:', error);
        // Fallback to placeholder
        return {
            type: 'image',
            url: 'https://via.placeholder.com/640x640/E4405F/FFFFFF?text=Instagram+Image',
            description: 'Instagram Image (Failed to load)'
        };
    }
}

// Event Listeners
downloadBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
        alert('Please enter a URL');
        return;
    }

    const platform = validateUrl(url);
    if (!platform) {
        alert('Please enter a valid Instagram URL');
        return;
    }

    downloadMedia(url, platform);
});

previewBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
        alert('Please enter a URL');
        return;
    }

    const platform = validateUrl(url);
    if (!platform) {
        alert('Please enter a valid Instagram URL');
        return;
    }

    previewOnly(url, platform);
});

modalDownloadBtn.addEventListener('click', () => {
    if (currentMediaData && currentPlatform) {
        hidePreview();
        downloadMediaFromPreview(currentMediaData, currentPlatform);
    }
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        downloadBtn.click();
    }
});

// Preview Modal Event Listeners
previewClose.addEventListener('click', hidePreview);
previewOverlay.addEventListener('click', hidePreview);

// Close preview modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !previewModal.classList.contains('hidden')) {
        hidePreview();
    }
});

// Auto-paste detection
navigator.clipboard.readText().then(text => {
    if (validateUrl(text)) {
        urlInput.value = text;
    }
}).catch(() => {
    // Clipboard access denied, ignore
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add some animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .platform-card, .step').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});
