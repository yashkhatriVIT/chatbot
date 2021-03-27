const socket = io();

// Elements
let text = document.getElementById('data');
let answer = document.getElementById('message-form');
let submit = document.getElementById('submit');
let messages = document.getElementById('messages');


// Templates
let messageTemplate = document.getElementById('message-template').innerHTML;
let locationTemplate = document.getElementById('location-template').innerHTML;
let sidebarTemplate = document.getElementById('sidebar-template').innerHTML;


// Options
let {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true});

let autoScroll = () => {
    // New Message Element
    const $newMessage = messages.lastElementChild

    // Height of new Message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = messages.offsetHeight;


    // Height of message container
    const containerHeight = messages.scrollHeight;

    // How far have I scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight;

    }



}

answer.addEventListener('submit', (event)=>{
    event.preventDefault();
    submit.setAttribute('disabled', 'disabled');
    socket.emit('sendMessage', text.value, (txt) => {
        submit.removeAttribute('disabled');
        text.value = '';
        text.focus();
        console.log(`${txt}`);
    });
});



let mapButton = document.querySelector('#find-me');
function geoFindMe() {
    mapButton.setAttribute('disabled', 'disabled');
    function success(position) {
        const latitude  = position.coords.latitude;
        const longitude = position.coords.longitude;
        socket.emit('sendLocation', {
            latitude ,
            longitude
        }, (txt) => {
            mapButton.removeAttribute('disabled');
            console.log(txt);
        });
    }
    function error() {

        alert('Unable to retrieve your location');
    }
    if(!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
    } else {
        navigator.geolocation.getCurrentPosition(success, error);
    }   
}
  
mapButton.addEventListener('click', geoFindMe);


socket.on('message', (data) => {
    const html = Mustache.render(messageTemplate, {
        username: data.username,
        message: data.text,
        createdAt: moment(data.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})


socket.on('locationMessage', (data) => {
    console.log(`${JSON.stringify(data)}`);
    const html = Mustache.render(locationTemplate, {
        username: data.username,
        message: data.url,
        createdAt: moment(data.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
    // let a = document.createElement('a');
    // let link = document.createTextNode(message);
    // a.appendChild(link); 
    // a.title = message; 
    // a.href = message;
    // messages.appendChild(a); 
})


socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(`${error}`);
        location.href = `/`;
    }
});


socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector("#sidebar").innerHTML = html;
})