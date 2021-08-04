//Global selections and variables
const colorDivs = document.querySelectorAll('.color');
const generateBtn = document.querySelector('.generate');
const generateMonoBtn = document.querySelector('.generate-monochrome');
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll('.color h2');
const popup = document.querySelector('.copy-container');
const adjustBtn = document.querySelectorAll('.adjust');
const lockBtn = document.querySelectorAll('.lock');
const closeAdjustments = document.querySelectorAll('.close-adjustment');
const sliderContainers = document.querySelectorAll('.sliders');
const colorInput = document.querySelector('.color-input');

let initialColors;

let savedPalettes = [];

//Add event listeners

sliders.forEach(slider => {
    slider.addEventListener('input', hslControls);
})

colorDivs.forEach((div, index) => {
    div.addEventListener('change', () => {
        updateTextUI(index)
    });
})

currentHexes.forEach(hex => {
    hex.addEventListener('click', () => {
        copyToClipboard(hex)
    });
})
popup.addEventListener('transitionend', () => {
    const popupBox = popup.children[0];
    popup.classList.remove('active');
    popupBox.classList.remove('active');

})

adjustBtn.forEach((button, index) => {
    button.addEventListener('click', () => {
        openAdjustmentPanel(index);
    })
})

closeAdjustments.forEach((button, index) => {
    button.addEventListener('click', () => {
        closeAdjustmentPanel(index);
    })
})

generateBtn.addEventListener('click', randomColors)

lockBtn.forEach((button, index) => {
    button.addEventListener('click', () => colorLock(button, index));
})

generateMonoBtn.addEventListener('click', randomMonoColors)
//Functions
// function generateHex() {
//     const letters = "0123456789ABCDEF";
//     let hash = "#";
//     for (let i = 0; i < 6; i++) {
//         hash += letters[Math.floor(Math.random() * 15)];
//     }
//     return hash;
// };

function generateHex() {
    const hexColor = chroma.random();
    return hexColor;
};

function checkTextContrast(color, text) {
    const luminance = chroma(color).luminance();
    if(luminance > 0.5) {
        text.style.color = 'black';
    } else {
        text.style.color = 'white';
    }
};


function randomColors() {
    initialColors = [];
    colorDivs.forEach((div, index) => {
        const hexText = div.children[0];
        const randomColor = generateHex();

        if(div.classList.contains('locked')) {
            initialColors.push(hexText.innerText) //Если есть лок, то в массив добавляется значение из hexText, которое сгенерировано при загрузке страницы/предыдущего нажатия на Generate
            return;
        } else {
            initialColors.push(randomColor.hex());
        }

        // Add color to bg
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;

        //Check for contrast
        checkTextContrast(randomColor, hexText)

        //Initial Colorize Sliders

        const color = chroma(randomColor);
        const sliders = div.querySelectorAll('.sliders input');
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        colorizeSliders(color, hue, brightness, saturation)
    });

    //Rest Inputs
    resetInputs();

    //Check for Button Contrast
    adjustBtn.forEach((button, index) => {
        checkTextContrast(initialColors[index], button);
        checkTextContrast(initialColors[index], lockBtn[index]);
    })

}

function colorizeSliders(color, hue, brightness, saturation) {
    //Scale Saturation
    const noSat = color.set('hsl.s', 0);
    const fullSat = color.set('hsl.s', 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);

    //Scale Brightness
    const midBright = color.set('hsl.l', 0.5);
    const scaleBright = chroma.scale(['black', midBright, 'white']);

    //Colors Input update
    saturation.style.backgroundImage = `linear-gradient(to right,${scaleSat(0)}, ${scaleSat(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right,${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75)`;
}

function hslControls(e) {
    const index = e.target.getAttribute('data-bright') ||
        e.target.getAttribute('data-sat') ||
        e.target.getAttribute('data-hue');

    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    const bgColor = initialColors[index];

    let color = chroma(bgColor)
        .set('hsl.s', saturation.value)
        .set('hsl.l', brightness.value)
        .set('hsl.h', hue.value)

    colorDivs[index].style.backgroundColor = color; //окрашиваем конкретный div при изменении настроек ползунков

    //Colorize sliders/inputs
    colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector("h2");
    const icons = activeDiv.querySelectorAll(".controls button");
    textHex.innerText = color.hex();

    //Check for contrast
    checkTextContrast(color, textHex);
    for(icon of icons) {
        checkTextContrast(color, icon);
    }

}

function resetInputs() {
    const sliders = document.querySelectorAll('.sliders input')
    sliders.forEach(slider => {
        if(slider.name === 'hue') {
            const hueColor = initialColors[slider.getAttribute('data-hue')];
            const hueValue = chroma(hueColor).hsl()[0];
            slider.value = Math.floor(hueValue);
        } else if(slider.name === 'brightness') {
            const brightColor = initialColors[slider.getAttribute('data-bright')];
            const brightValue = chroma(brightColor).hsl()[2];
            slider.value = Math.floor(brightValue * 100) / 100;
        } else if(slider.name === 'saturation') {
            const satColor = initialColors[slider.getAttribute('data-sat')];
            const satValue = chroma(satColor).hsl()[1];
            slider.value = Math.floor(satValue * 100) / 100;
        }
    })
}

function copyToClipboard(hex) {
    const el = document.createElement('textarea'); // создаем невидимую textarea
    el.value = hex.innerText; // её значение = значению цвета
    document.body.appendChild(el); // аппенд к боди
    el.select(); // выбираем текстарею
    document.execCommand('copy'); // выполняем команду копирования
    document.body.removeChild(el); //удаляем элемент

    //Pop pup animation;
    const popupBox = popup.children[0];
    popup.classList.add('active');
    popupBox.classList.add('active');
}

function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle('active'); // открытие панелей завязано на классах и css стилях для классов
}
function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove('active');
}
function colorLock(button, index) {
    if(!colorDivs[index].classList.contains('locked')) {
        button.innerHTML = '<i class="fas fa-lock"></i>';
        colorDivs[index].classList.add('locked')
    } else {
        button.innerHTML = '<i class="fas fa-lock-open"></i>';
        colorDivs[index].classList.remove('locked')
    }

}

// Implements Save to palette and local storage stuff
const saveBtn = document.querySelector('.save');
const submitSave = document.querySelector('.submit-save');
const closeSave = document.querySelector('.close-save');
const saveContainer = document.querySelector('.save-container');
const saveInput = document.querySelector('.save-container input');
const libraryContainer = document.querySelector('.library-container');
const libraryBtn = document.querySelector('.library');
const closeLibraryBtn = document.querySelector('.close-library');

// Event Listeners

saveBtn.addEventListener('click', openPalette);
closeSave.addEventListener('click', closePalette);
submitSave.addEventListener('click', (e) => savePalette(e));
libraryBtn.addEventListener('click', openLibrary);
closeLibraryBtn.addEventListener('click', closeLibrary);


function openPalette() {
    const popup = saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}

function closePalette() {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
}
function savePalette(e) {
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    })

    //Generate object
    let paletteNr;
    const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
    if(paletteObjects) {
        paletteNr = paletteObjects.length;
    } else {
        paletteNr = savedPalettes.length;
    }
    const paletteObj = {name, colors, nr: paletteNr}
    savedPalettes.push(paletteObj);

    //Save to localStoreage
    savetoLocal(paletteObj);
    saveInput.value = '';

    //Generate the palette for library
    const palette = document.createElement('div');
    palette.classList.add('custom-palette');
    const title = document.createElement('h4');
    title.innerText = paletteObj.name;
    const preview = document.createElement('div');
    preview.classList.add('small-preview');
    paletteObj.colors.forEach(smallColor => {
        const smallDiv = document.createElement('div');
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
    })
    const paletteBtn = document.createElement('button');
    paletteBtn.classList.add('pick-palette-btn');
    paletteBtn.classList.add(paletteObj.nr);
    paletteBtn.innerText = 'Select';

    //Attach event to the btn
    paletteBtn.addEventListener('click', e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text);
            updateTextUI(index);
        })
        resetInputs();
    });

    //Append to Library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);
}

function savetoLocal(paletteObj) {
    let localPalettes;
    if(!localStorage.getItem('palettes')) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem('palettes'))
    }
    localPalettes.push(paletteObj);
    localStorage.setItem('palettes', JSON.stringify(localPalettes));
}
function openLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popup.classList.add('active');
}

function closeLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popup.classList.remove('active');
}

function getLocal() {
    let localPalettes;
    if(!localStorage.getItem('palettes')) {
        localPalettes = [];
    } else {
        const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
        savedPalettes = [...paletteObjects];
        paletteObjects.forEach(paletteObj => {
            //Generate the palette for library
            const palette = document.createElement('div');
            palette.classList.add('custom-palette');
            const title = document.createElement('h4');
            title.innerText = paletteObj.name;
            const preview = document.createElement('div');
            preview.classList.add('small-preview');
            paletteObj.colors.forEach(smallColor => {
                const smallDiv = document.createElement('div');
                smallDiv.style.backgroundColor = smallColor;
                preview.appendChild(smallDiv);
            })
            const paletteBtn = document.createElement('button');
            paletteBtn.classList.add('pick-palette-btn');
            paletteBtn.classList.add(paletteObj.nr);
            paletteBtn.innerText = 'Select';

            //Attach event to the btn
            paletteBtn.addEventListener('click', e => {
                closeLibrary();
                const paletteIndex = e.target.classList[1];
                initialColors = [];
                paletteObjects[paletteIndex].colors.forEach((color, index) => {
                    initialColors.push(color);
                    colorDivs[index].style.backgroundColor = color;
                    const text = colorDivs[index].children[0];
                    checkTextContrast(color, text);
                    updateTextUI(index);
                })
                resetInputs();
            });

            //Append to Library
            palette.appendChild(title);
            palette.appendChild(preview);
            palette.appendChild(paletteBtn);
            libraryContainer.children[0].appendChild(palette);
        })
    }
    // localPalettes.push(paletteObj);
    // localStorage.setItem('palettes', JSON.stringify(localPalettes));
}

function randomMonoColors() {
    const inputColor = colorInput.value ? colorInput.value : generateHex().hex();
    let minSat;
    try {
        minSat = chroma(inputColor).set('hsl.l', 0.8);
    } catch (e) {
        alert('Invalid color name or hex!');
        colorInput.value = '';
    }
    console.log(inputColor);
    const scale = chroma.scale([inputColor, minSat])
        .mode('lch').colors(5)
    console.log(chroma(scale[0]));
    initialColors = [];
    colorDivs.forEach((div, index) => {
        const hexText = div.children[0];

        // Проверка на лок
        if(div.classList.contains('locked')) {
            initialColors.push(hexText.innerText)
            return;
        } else {
            initialColors.push(scale[index]);
        }

        // Add color to bg
        div.style.backgroundColor = scale[index];
        hexText.innerText = scale[index];

        //Check for contrast
        checkTextContrast(chroma(scale[index]), hexText)

        //Initial Colorize Sliders

        const color = chroma(scale[index]);
        const sliders = div.querySelectorAll('.sliders input');
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        colorizeSliders(color, hue, brightness, saturation)


    })

    resetInputs();

    adjustBtn.forEach((button, index) => {
        checkTextContrast(initialColors[index], button);
        checkTextContrast(initialColors[index], lockBtn[index]);
    })
}

getLocal();
randomColors()