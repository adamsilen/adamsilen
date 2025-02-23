document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const dropzone = document.getElementById('dropzone');
    const photoInput = document.getElementById('photoInput');
    const submitButton = document.getElementById('submitButton');
    const imageInfo = document.getElementById('imageInfo');
    const dropText = document.getElementById('dropText');

    // Get today's date for new uploads
    const today = new Date().toISOString().split('T')[0];

    // Handle file selection
    dropzone.addEventListener('click', () => photoInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--text-color)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--text-color)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--text-color)';
        handleFiles(e.dataTransfer.files);
    });

    photoInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });


    async function handleFiles(files) {
        // Create preview grid if it doesn't exist
        let previewGrid = document.querySelector('.preview-grid');
        if (!previewGrid) {
            previewGrid = document.createElement('div');
            previewGrid.className = 'preview-grid';
            dropzone.insertAdjacentElement('afterend', previewGrid);
        }
        
        // Show info for all files
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} is not an image.`);
                continue;
            }
    
            // Create container for each image and its fields
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-upload-container';
    
            // Add remove button
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-image';
            removeButton.innerHTML = '&times;';
            removeButton.title = 'Remove image';
            removeButton.onclick = () => {
                imageContainer.remove();
                // Disable submit button if no images left
                submitButton.disabled = !document.querySelectorAll('.image-upload-container').length;
            };
            imageContainer.appendChild(removeButton);
    
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-thumbnail';
                imageContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
    
            // Add file info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            imageContainer.appendChild(fileInfo);
    
            // Add date picker
            const dateGroup = document.createElement('div');
            dateGroup.className = 'form-group';
            const dateLabel = document.createElement('label');
            dateLabel.textContent = 'Date:';
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.value = today;
            dateInput.required = true;
            dateGroup.appendChild(dateLabel);
            dateGroup.appendChild(dateInput);
            imageContainer.appendChild(dateGroup);
    
            // Add description field
            const descGroup = document.createElement('div');
            descGroup.className = 'form-group';
            const descLabel = document.createElement('label');
            descLabel.textContent = 'Description:';
            const descInput = document.createElement('textarea');
            descInput.required = true;
            descGroup.appendChild(descLabel);
            descGroup.appendChild(descInput);
            imageContainer.appendChild(descGroup);
    
            previewGrid.appendChild(imageContainer);
        }
    
        // Enable submit button if there are any images
        submitButton.disabled = !document.querySelectorAll('.image-upload-container').length;
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
            const files = photoInput.files;
            if (!files.length) {
                throw new Error('Please select at least one image');
            }
    
            // Get credentials once for all uploads
            const uploadPassword = document.getElementById('uploadPassword').value;
            if (!uploadPassword) {
                throw new Error('Please provide the upload password');
            }
    
            // Get auth parameters from Netlify function
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
    
            // Process each image
            for (const file of files) {
                console.log(`Processing ${file.name}...`);
    
                // Find the container for this file
                const container = [...document.querySelectorAll('.image-upload-container')]
                    .find(c => c.querySelector('.file-info').textContent.includes(file.name));
                
                if (!container) continue;
    
                // Get values from this container's fields
                const date = container.querySelector('input[type="date"]').value;
                const description = container.querySelector('textarea').value;
    
                // Resize image
                const resizedBlob = await resizeImage(file);
                
                // Upload to ImageKit
                const uploadResult = await new Promise((resolve, reject) => {
                    imagekit.upload({
                        file: resizedBlob,
                        fileName: file.name,
                        token: authData.token,
                        signature: authData.signature,
                        expire: authData.expire,
                        useUniqueFileName: false
                    }, function(err, result) {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
    
                // Get and update photos.yml
                const [owner, repo] = CONFIG.githubRepo.split('/');
                const photosYmlResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.yml`, {
                    headers: {
                        'Authorization': `token ${authData.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
    
                if (!photosYmlResponse.ok) {
                    throw new Error(`Failed to fetch photos.yml for ${file.name}`);
                }
    
                const photosYmlData = await photosYmlResponse.json();
                let content = decodeURIComponent(escape(atob(photosYmlData.content)));
                
                const newEntry = `\n\n- date: ${date}\n  image: ${file.name}\n  description: "${description}"`;
                content = content + newEntry;
    
                await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.yml`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${authData.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: `Add photo: ${file.name}`,
                        content: btoa(unescape(encodeURIComponent(content))),
                        sha: photosYmlData.sha
                    })
                });
            }
    
            alert('All photos uploaded successfully!');
            form.reset();
            const previewGrid = document.querySelector('.preview-grid');
            if (previewGrid) previewGrid.remove();
            dropText.style.display = 'block';
            imageInfo.textContent = '';
    
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error: ' + error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
    
    
});