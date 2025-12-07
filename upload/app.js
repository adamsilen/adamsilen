document.addEventListener('DOMContentLoaded', function() {
    // Add this Map to store all selected files
    let selectedFiles = new Map();

    /**
     * Sanitizes filename to match ImageKit's transformation
     * ImageKit automatically converts spaces and special characters to underscores
     */
    function sanitizeFilename(filename) {
        const lastDot = filename.lastIndexOf('.');
        const name = filename.substring(0, lastDot);
        const ext = filename.substring(lastDot);
        
        // Replace spaces and special characters with underscores
        // This matches ImageKit's transformation rules
        const sanitized = name
            .replace(/\s+/g, '_')           // spaces to underscores
            .replace(/[()[\]{}]/g, '_')     // brackets/parentheses to underscores
            .replace(/[#%&+]/g, '_')        // other special chars to underscores
            .replace(/_+/g, '_')            // multiple underscores to single
            .replace(/^_|_$/g, '');         // trim underscores from start/end
        
        return sanitized + ext;
    }

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

            // Store file in our Map
            selectedFiles.set(file.name, file);

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
                selectedFiles.delete(file.name); // Remove file from Map when container is removed
                imageContainer.remove();
                // Disable submit button if no images left
                submitButton.disabled = !document.querySelectorAll('.image-upload-container').length;
            };
            imageContainer.appendChild(removeButton);

            // Create preview image
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.className = 'preview-thumbnail';
            imageContainer.appendChild(img);

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
            dateInput.required = true;
            dateInput.value = today;

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
            const containers = document.querySelectorAll('.image-upload-container');
            console.log('Number of containers:', containers.length);
            console.log('Selected files:', selectedFiles);

            if (!containers.length) {
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
    
            // Collect all new entries
            let newEntries = [];
    
// Process each image container
for (const container of containers) {
    try {
        const fileInfo = container.querySelector('.file-info').textContent;
        const fileName = fileInfo.substring(0, fileInfo.indexOf(' ('));
        console.log('Looking for file:', fileName);

        const file = selectedFiles.get(fileName);
        if (!file) {
            console.error(`File not found: ${fileName}`);
            continue;
        }

        console.log(`Processing ${fileName}...`);

        const date = container.querySelector('input[type="date"]').value;
        const description = container.querySelector('textarea').value;

        // Sanitize filename to match ImageKit's transformation
        const sanitizedFileName = sanitizeFilename(fileName);
        console.log(`Sanitizing: "${fileName}" → "${sanitizedFileName}"`);

        // Get fresh auth parameters for each file
        const authResponse = await fetch(CONFIG.signatureEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: uploadPassword })
        });

        if (!authResponse.ok) {
            throw new Error('Failed to get upload authentication');
        }

        const authData = await authResponse.json();

        // Resize and upload image
        const resizedBlob = await resizeImage(file);
        console.log(`Uploading ${sanitizedFileName} to ImageKit...`);
        
        const uploadResult = await new Promise((resolve, reject) => {
            imagekit.upload({
                file: resizedBlob,
                fileName: sanitizedFileName,  // Use sanitized filename
                token: authData.token,
                signature: authData.signature,
                expire: authData.expire,
                useUniqueFileName: false
            }, function(err, result) {
                if (err) {
                    console.error(`Upload error for ${sanitizedFileName}:`, err);
                    reject(err);
                } else {
                    console.log(`Successfully uploaded ${sanitizedFileName}`);
                    resolve(result);
                }
            });
        });

        // Collect the entry
        newEntries.push({
            date,
            fileName: sanitizedFileName,  // Use sanitized filename
            description
        });
        console.log(`Added ${sanitizedFileName} to entries`);
    } catch (error) {
        console.error(`Error processing ${container.querySelector('.file-info').textContent}:`, error);
    }
}


console.log('Final entries:', newEntries);
            // Get current photos.yml content
            const [owner, repo] = CONFIG.githubRepo.split('/');
            const photosYmlResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.yml`, {
                headers: {
                    'Authorization': `token ${authData.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
    
            if (!photosYmlResponse.ok) {
                throw new Error('Failed to fetch photos.yml');
            }
    
            const photosYmlData = await photosYmlResponse.json();
            let content = decodeURIComponent(escape(atob(photosYmlData.content)));
    
            // Add all new entries at once
            const allNewEntries = newEntries
                .map(entry => `\n\n- date: ${entry.date}\n  image: ${entry.fileName}\n  description: "${entry.description}"`)
                .join('');
            
            content = content + allNewEntries;
    
            // Single update to photos.yml
            await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.yml`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${authData.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Add photos: ${newEntries.map(e => e.fileName).join(', ')}`,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: photosYmlData.sha
                })
            });
    
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