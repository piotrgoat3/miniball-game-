function hideLsDropdown(event) {
    if(event.target.id !== 'lsbtn' && event.target.parentNode.id !== 'lsbtn') {
        document.getElementById("lsDropdown").classList.toggle("show");
        window.removeEventListener('click', hideLsDropdown);
    }
}

function langSwitcherHandler() {
    let dropdown = document.getElementById("lsDropdown");
    dropdown.classList.toggle("show");
    if(dropdown.classList.contains("show")){
        window.addEventListener('click', hideLsDropdown);
    }
    else{
        window.removeEventListener('click', hideLsDropdown);
    }
}

function setLanguage(event) {
    let prefix = 'lang_';
    let langCode = 'xx';
    if(event.target.id.indexOf(prefix) !== -1)
    {
        langCode = event.target.id.replace('lang_', '')
    }
    else if(event.target.parentNode.id.indexOf(prefix) !== -1)
    {
        langCode = event.target.parentNode.id.replace('lang_', '')
    }
    document.cookie = "site_lang=" + langCode + ';path=/;max-age=31536000';
}

(function(){
    let coll = document.getElementsByClassName("collapse-button");
    for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            let content = this.nextElementSibling;
            this.classList.toggle("active");
            if (content.style.maxHeight){
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
})();
