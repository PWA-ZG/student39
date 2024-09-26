fetch('/saved_thoughts', {
        method: 'GET'
    })
    .then(function (res) {
        if (res.ok) {
            res.json()
                .then(function (data) {
                    let audioTemplate = document.querySelector('#audio-template');
            		let gallery = document.querySelector('.gallery');

                    for (thought of data.files){
                        let audio = audioTemplate.content.cloneNode(true);
                        let audioBox = audio.querySelector('.audio-box > audio')
                        audioBox.src = `uploads/${thought}`
                        let audioName = audio.querySelector('div.audio-box-title.font-secondary.main-color-emphasized');
                        audioName.textContent = thought.substring(24, thought.length - 4);
                        gallery.appendChild(audio);
                    }
                });
        } else {
            console.log(res);
        }
    })
    .catch(function (error) {
        console.log(error);
});