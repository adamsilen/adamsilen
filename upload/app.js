document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const dropzone = document.getElementById('dropzone');
    const photoInput = document.getElementById('photoInput');
    const preview = document.getElementById('preview');
    const dropText = document.getElementById('dropText');
    const submitButton = document.getElementById('submitButton');
    const imageInfo = document.getElementById('imageInfo');
    const dateInput = document.getElementById('date');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Handle file selection
    dropzone.addEventListener('click', () => photoInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#000';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#ccc';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ccc';
        handleFiles(e.dataTransfer.files);
    });

    photoInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    async function handleFiles(files) {
        const file = files[0];
        console.log('File selected:', file);
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Show original image info
        imageInfo.textContent = `Original: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        console.log('File info updated');

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            dropText.style.display = 'none';
            console.log('Preview created'); // Debug log
        };
        reader.readAsDataURL(file);

        // Enable submit button
        submitButton.disabled = false;
        console.log('Submit button enabled'); // Debug log
    }

    async function resizeImage(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > CONFIG.maxDimension || height > CONFIG.maxDimension) {
                    if (width > height) {
                        height = (height * CONFIG.maxDimension) / width;
                        width = CONFIG.maxDimension;
                    } else {
                        width = (width * CONFIG.maxDimension) / height;
                        height = CONFIG.maxDimension;
                    }
                }

                // Create canvas and resize
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', CONFIG.jpegQuality);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
    
        try {
            const file = photoInput.files[0];
            if (!file) {
                throw new Error('Please select an image');
            }
    
            // Resize image
            const resizedBlob = await resizeImage(file);
            imageInfo.textContent += `\nResized: ${(resizedBlob.size / 1024 / 1024).toFixed(2)} MB`;
    
            // Get credentials
            const uploadPassword = document.getElementById('uploadPassword').value;
    
            if (!uploadPassword) {
                throw new Error('Please provide the upload password');
            }
    
            // Get auth parameters from Netlify function
            console.log('Getting signature...');
            const authResponse = await fetch(CONFIG.signatureEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: uploadPassword })
            });
    
            if (!authResponse.ok) {
                const error = await authResponse.json();
                throw new Error(error.error || 'Failed to get upload authentication');
            }
    
            const authData = await authResponse.json();
            console.log('Got auth data:', authData);
    
            // Upload using ImageKit SDK
            console.log('Uploading to ImageKit...');
            const uploadResult = await new Promise((resolve, reject) => {
                imagekit.upload({
                    file: resizedBlob,
                    fileName: file.name,
                    token: authData.token,
                    signature: authData.signature,
                    expire: authData.expire,
                    useUniqueFileName: false
                }, function(err, result) {
                    if (err) {
                        console.error('ImageKit upload error:', err);
                        reject(err);
                    } else {
                        console.log('ImageKit upload success:', result);
                        resolve(result);
                    }
                });
            });
    
            // Update photos.yml
            console.log('Updating photos.yml...');
            const date = document.getElementById('date').value;
            const description = document.getElementById('description').value;
            
            // Get current photos.yml content
            const [owner, repo] = CONFIG.githubRepo.split('/');
            const photosYmlUrl = `https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.yml`;
            console.log('Fetching from:', photosYmlUrl);
    
            const photosYmlResponse = await fetch(photosYmlUrl, {
                headers: {
                    'Authorization': `token ${authData.githubToken}`, // Use token from Netlify response
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
    
            if (!photosYmlResponse.ok) {
                const errorData = await photosYmlResponse.json();
                console.error('GitHub API error:', {
                    status: photosYmlResponse.status,
                    statusText: photosYmlResponse.statusText,
                    error: errorData
                });
                throw new Error(`Failed to fetch photos.yml: ${photosYmlResponse.status} ${photosYmlResponse.statusText}`);
            }
    
            const photosYmlData = await photosYmlResponse.json();
            let content = decodeURIComponent(escape(atob(photosYmlData.content)));
            
            // Add new photo entry
            const newEntry = `\n\n- date: ${date}\n  image: ${file.name}\n  description: "${description}"`;
            content = content + newEntry;
    
            // Update photos.yml
            const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.yml`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${authData.githubToken}`, // Use token from Netlify response
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Add photo: ${file.name}`,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: photosYmlData.sha
                })
            });
            
            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(`Failed to update photos.yml: ${errorData.message}`);
            }
    
            console.log('Upload complete!');
            alert('Photo uploaded successfully!');
            form.reset();
            preview.style.display = 'none';
            dropText.style.display = 'block';
            imageInfo.textContent = '';
            dateInput.value = today;
    
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error: ' + error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
});