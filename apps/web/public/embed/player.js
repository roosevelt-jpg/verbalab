(function () {
  var script = document.currentScript;
  var id = script && script.getAttribute('data-lugemi-embed');
  if (!id) return;
  var host = document.getElementById('lugemi-speech-' + id);
  if (!host) {
    host = document.createElement('div');
    host.id = 'lugemi-speech-' + id;
    script.parentNode.insertBefore(host, script);
  }
  var origin = script.src ? script.src.replace(/\/embed\/player\.js.*$/, '') : '';
  var frame = document.createElement('iframe');
  frame.src = origin + '/embed/' + encodeURIComponent(id);
  frame.title = 'Lugemi Speech Player';
  frame.style.cssText =
    'width:100%;max-width:720px;height:220px;border:0;border-radius:14px;overflow:hidden;background:transparent;';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  host.appendChild(frame);
})();
