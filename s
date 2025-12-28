body {
  background: #111;
  color: #eee;
  font-family: system-ui, sans-serif;
  text-align: center;
}

#game {
  background: #66caff;
  border: 3px solid #222;
  image-rendering: pixelated;
  display: block;
  margin: 0 auto;
}

#ui {
  margin-top: 10px;
}

#hotbar {
  display: inline-flex;
  gap: 6px;
  margin-bottom: 6px;
}

.slot {
  padding: 4px 8px;
  border: 2px solid #555;
  border-radius: 4px;
  background: #222;
  color: #eee;
  font-size: 14px;
  cursor: default;
}

.slot.selected {
  border-color: #ffcc00;
  background: #444;
}
