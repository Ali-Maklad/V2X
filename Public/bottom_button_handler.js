//handle the map fullscreen and small screen button
document.getElementById('toggleButton').addEventListener('click', function() {
    const leftContainer = document.getElementById('left-container');
    const mapContainer = document.getElementById('map-container');

    leftContainer.classList.toggle('hidden');
    mapContainer.classList.toggle('fullscreen');
    map.resize();
    if (mapContainer.classList.contains('fullscreen')) {
        toggleButton.textContent = 'Show map smaller screen';
    } else {
        toggleButton.textContent = 'Show map full screen';
    }
});

//for zoomin button 
document.getElementById('zoomInButton').addEventListener('click', function () {
    map.zoomIn();
    map.resize();
});
// for zoomout button
document.getElementById('zoomOutButton').addEventListener('click', function () {
   map.zoomOut();
   map.resize();
});
// for recenter button 
document.getElementById('recenterButton').addEventListener('click', function () {
  addWarningMessage("i love you")
});
//it make the user able to drag the map to any direction 
map.addControl(new mapboxgl.NavigationControl());
