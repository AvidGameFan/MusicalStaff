class MusicalStaff {
    constructor() {
        this.canvas = document.getElementById('staff');
        this.ctx = this.canvas.getContext('2d');
        this.noteDisplay = document.getElementById('note-display');
        
        // Track first draw
        this.isFirstDraw = true;

        // Initialize dimensions based on screen size
        this.initDimensions();
        
        // Handle resize events
        window.addEventListener('resize', () => {
            this.initDimensions();
            this.draw();
        });

        // Initialize audio context but don't create it yet (wait for user interaction)
        this.audioContext = null;
        
        // Set up click handling
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // Store active notes for visual feedback
        this.activeNotes = [];
        
        // Draw initial staff
        this.draw();

        // Add key signature handling
        this.keySelector = document.getElementById('key-selector');
        this.keySelector.addEventListener('change', () => {
            this.updateKey();
            this.draw();
        });
        
        // Initialize key signature data
        this.initKeySignatures();
    }

    initDimensions() {
        // Set pixel ratio first
        this.pixelRatio = window.devicePixelRatio || 1;
        
        const isMobile = window.innerWidth <= 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isMobile) {
            // For mobile, use viewport-relative sizing
            const canvasWidth = isPortrait ? '95vw' : '80vw';
            const canvasHeight = isPortrait ? '70vh' : '60vh';
            this.canvas.style.width = canvasWidth;
            this.canvas.style.height = canvasHeight;
            
            // Force a layout calculation to get actual size
            this.canvas.getBoundingClientRect();
            
            // Get actual size in pixels after layout
            const computedStyle = window.getComputedStyle(this.canvas);
            const width = parseFloat(computedStyle.width);
            const height = parseFloat(computedStyle.height);
            
            this.canvas.width = width * this.pixelRatio;
            this.canvas.height = height * this.pixelRatio;
            
            // Adjust staff dimensions
            this.noteRadius = isMobile ? 8 : 10;
            this.lineSpacing = isMobile ? 18 : 20;
            this.staffX = width * 0.25;
            this.staffWidth = width * 0.6;
        } else {
            // Desktop dimensions
            this.canvas.style.width = '650px';
            this.canvas.style.height = '400px';
            this.canvas.width = 650 * this.pixelRatio;
            this.canvas.height = 400 * this.pixelRatio;
            
            this.noteRadius = 10;
            this.lineSpacing = 20;
            this.staffX = 100;
            this.staffWidth = 500;
        }
        
        // Staff Y positions remain proportional
        const logicalHeight = this.canvas.height / this.pixelRatio;
        this.trebleStaffY = logicalHeight * 0.2;
        this.bassStaffY = logicalHeight * 0.6;
        

    }

    initAudio() {
        if (this.audioContext) return;
        
        // Create audio context with iOS-compatible options
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: 44100
        });
        
        // iOS requires resume on user interaction
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    draw() {
        // Reset transform and clear
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply scaling
        this.ctx.scale(this.pixelRatio, this.pixelRatio);

        
        this.drawClefs();
        this.drawStaffLines(this.trebleStaffY); // Treble staff
        this.drawStaffLines(this.bassStaffY);   // Bass staff
        this.drawActiveNotes();
    }

    drawClefs() {
        const isMobile = window.innerWidth <= 768;

        this.ctx.fillStyle = '#000';
        this.ctx.font = '80px serif';
        // Treble clef (G clef)
        // Adjust clef positions based on screen size
        if (isMobile) {
            this.trebleClefX = this.isFirstDraw ? this.staffX - 85 : this.staffX - 40;
            this.bassClefX = this.isFirstDraw ? this.staffX - 85 : this.staffX - 30;
        } else {
            this.trebleClefX = this.isFirstDraw ? 15 : 60;
            this.bassClefX = this.isFirstDraw ? 15 : 70;
        }

        this.ctx.fillText('𝄞', this.trebleClefX, this.trebleStaffY + 65);
        // Bass clef (F clef)
        this.ctx.fillText('𝄢', this.bassClefX, this.bassStaffY + 70);

        // Draw note letters
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        
        // Treble staff note letters (from bottom to top)
        const trebleNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
        for (let i = 0; i < trebleNotes.length; i++) {
            const y = this.trebleStaffY + (5 - i/2) * this.lineSpacing;
            this.ctx.fillText(trebleNotes[i], this.staffX - 10 + 10*(i%2), y + 4);
        }

        // Bass staff note letters (from bottom to top)
        const bassNotes = ['F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];
        for (let i = 0; i < bassNotes.length; i++) {
            const y = this.bassStaffY + (4.5 - i/2) * this.lineSpacing;
            this.ctx.fillText(bassNotes[i], this.staffX - 10 + 10*((i+1)%2), y + 4);
        }

        // Update note letter display to show accidentals
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        
        // Draw treble staff note letters
        for (let i = 0; i < trebleNotes.length; i++) {
            const y = this.trebleStaffY + (5 - i/2) * this.lineSpacing;
            this.ctx.fillText(trebleNotes[i], 
                            this.staffX - 10 + 10*(i%2), y + 4);
        }

        // Draw bass staff note letters
        for (let i = 0; i < bassNotes.length; i++) {
            const y = this.bassStaffY + (4.5 - i/2) * this.lineSpacing;
            this.ctx.fillText(bassNotes[i], 
                            this.staffX - 10 + 10*((i+1)%2), y + 4);
        }

        // Update first draw flag
        this.isFirstDraw = false;
    }

    drawStaffLines(startY) {
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        
        // Draw 5 staff lines
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.staffX, startY + i * this.lineSpacing);
            this.ctx.lineTo(this.staffX + this.staffWidth, startY + i * this.lineSpacing);
            this.ctx.stroke();
        }
    }

    drawActiveNotes() {
        const currentTime = performance.now();
        this.activeNotes = this.activeNotes.filter(note => {
            const age = currentTime - note.timestamp;
            if (age < 2000) { // Keep notes visible for 2 seconds
                const opacity = 1 - (age / 2000);
                this.ctx.beginPath();
                this.ctx.arc(note.x, note.y, this.noteRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0, 0, 255, ${opacity})`;
                this.ctx.fill();
                this.ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
                this.ctx.stroke();
                return true;
            }
            return false;
        });
        
        if (this.activeNotes.length > 0) {
            requestAnimationFrame(() => this.draw());
        }
    }

    getNoteName(frequency) {
        const A4 = 440;
        const semitones = Math.round(12 * Math.log2(frequency / A4));
        const octave = Math.floor((semitones + 9) / 12) + 4;
        const noteIndex = (semitones + 9) % 12;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return `${noteNames[noteIndex]}${octave}`;
    }

    handleClick(event) {
        // Initialize audio on first click
        this.initAudio();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert click coordinates to canvas coordinates
        const canvasX = (x * this.canvas.width) / rect.width;
        const canvasY = (y * this.canvas.height) / rect.height;
        
        // Convert to logical coordinates (accounting for pixel ratio)
        const logicalX = canvasX / this.pixelRatio;
        const logicalY = canvasY / this.pixelRatio;

        // Check if click is within staff area
        if (logicalX >= this.staffX && logicalX <= this.staffX + this.staffWidth) {
            const result = this.getFrequencyFromPosition(logicalY);
            if (result) {
                this.playNote(result.frequency);
                this.activeNotes.push({
                    x: logicalX,
                    y: result.y,
                    timestamp: performance.now()
                });
                
                // Update note display
                this.noteDisplay.textContent = `${result.noteName} (${Math.round(result.frequency)} Hz)`;
                
                this.draw();
            }
        }
    }
//--------------- Key handling -----------------
initKeySignatures() {
    // Define key signatures and their accidentals
    this.keySignatures = {
        'C':  { sharps: [], flats: [] },
        'G':  { sharps: ['F'], flats: [] },
        'D':  { sharps: ['F', 'C'], flats: [] },
        'A':  { sharps: ['F', 'C', 'G'], flats: [] },
        'E':  { sharps: ['F', 'C', 'G', 'D'], flats: [] },
        'F':  { sharps: [], flats: ['B'] },
        'Bb': { sharps: [], flats: ['B', 'E'] },
        'Eb': { sharps: [], flats: ['B', 'E', 'A'] },
        'Ab': { sharps: [], flats: ['B', 'E', 'A', 'D'] }
    };

    // Base frequencies for natural notes (A4 = 440Hz)
    this.baseFrequencies = {
        'C': -9, 'D': -7, 'E': -5, 'F': -4,
        'G': -2, 'A': 0,  'B': 2
    };
}

updateKey() {
    const key = this.keySelector.value;
    this.currentKey = this.keySignatures[key];
    this.updateNotePositions();
}

getNoteNameInKey(baseName, octave) {
    const noteLetter = baseName.charAt(0);
    if (this.currentKey.sharps.includes(noteLetter)) {
        return `${noteLetter}♯${octave}`;
    } else if (this.currentKey.flats.includes(noteLetter)) {
        return `${noteLetter}♭${octave}`;
    }
    return `${noteLetter}${octave}`;
}

getFrequencyForNote(noteName) {
    const A4 = 440;
    const noteLetter = noteName.charAt(0);
    const octave = parseInt(noteName.slice(-1));
    
    // Get base semitones from A4
    let semitones = this.baseFrequencies[noteLetter];
    
    // Adjust for octave
    semitones += (octave - 4) * 12;
    
    // Adjust for key signature
    if (this.currentKey.sharps.includes(noteLetter)) {
        semitones += 1;
    } else if (this.currentKey.flats.includes(noteLetter)) {
        semitones -= 1;
    }
    
    return A4 * Math.pow(2, semitones/12);
}

updateNotePositions() {
    // Generate note positions dynamically
    const trebleNotes = [];
    const bassNotes = [];
    
    // Treble staff notes (C4 to A5)
    for (let octave = 4; octave <= 5; octave++) {
        for (let note of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
            if (octave === 5 && note === 'B') break;
            const noteName = this.getNoteNameInKey(note, octave);
            trebleNotes.push({
                name: noteName,
                frequency: this.getFrequencyForNote(note + octave)
            });
        }
    }

    // Bass staff notes (F2 to C4)
    for (let octave = 2; octave <= 4; octave++) {
        for (let note of ['F', 'G', 'A', 'B', 'C', 'D', 'E']) {
            if (octave === 4 && note !== 'C') break;
            const noteName = this.getNoteNameInKey(note, octave);
            bassNotes.push({
                name: noteName,
                frequency: this.getFrequencyForNote(note + octave)
            });
        }
    }

    this.trebleNotes = trebleNotes;
    this.bassNotes = bassNotes;
}
//----------------------------------------------
getFrequencyFromPosition(y) {
    // Helper function to get note position and frequency
    const getNoteInfo = (staffY, position, noteLetter, octave) => {
        const noteName = this.getNoteNameInKey(noteLetter, octave);
        return {
            y: staffY + position * this.lineSpacing,
            frequency: this.getFrequencyForNote(noteLetter + octave),
            noteName: noteName
        };
    };

    // Map Y position to notes (from bottom to top for each staff)
    const treblePositions = {
        // Lines (from bottom to top)
        [this.trebleStaffY + 5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 5, 'C', 4),
        [this.trebleStaffY + 4 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 4, 'E', 4),
        [this.trebleStaffY + 3 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 3, 'G', 4),
        [this.trebleStaffY + 2 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 2, 'B', 4),
        [this.trebleStaffY + this.lineSpacing]: getNoteInfo(this.trebleStaffY, 1, 'D', 5),
        [this.trebleStaffY]: getNoteInfo(this.trebleStaffY, 0, 'F', 5),
        [this.trebleStaffY - 1 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, -1, 'A', 5),
        
        // Spaces (from bottom to top)
        [this.trebleStaffY + 4.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 4.5, 'D', 4),
        [this.trebleStaffY + 3.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 3.5, 'F', 4),
        [this.trebleStaffY + 2.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 2.5, 'A', 4),
        [this.trebleStaffY + 1.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 1.5, 'C', 5),
        [this.trebleStaffY + 0.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 0.5, 'E', 5),
        [this.trebleStaffY - 0.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, -0.5, 'G', 5)
    };

    const bassPositions = {
        // Lines (from bottom to top)
        [this.bassStaffY + 4 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 4, 'G', 2),
        [this.bassStaffY + 3 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 3, 'B', 2),
        [this.bassStaffY + 2 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 2, 'D', 3),
        [this.bassStaffY + this.lineSpacing]: getNoteInfo(this.bassStaffY, 1, 'F', 3),
        [this.bassStaffY]: getNoteInfo(this.bassStaffY, 0, 'A', 3),
        [this.bassStaffY - 1 * this.lineSpacing]: getNoteInfo(this.bassStaffY, -1, 'C', 4),

        // Spaces (from bottom to top)
        [this.bassStaffY + 4.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 4.5, 'F', 2),
        [this.bassStaffY + 3.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 3.5, 'A', 2),
        [this.bassStaffY + 2.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 2.5, 'C', 3),
        [this.bassStaffY + 1.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 1.5, 'E', 3),
        [this.bassStaffY + 0.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 0.5, 'G', 3),
        [this.bassStaffY - 0.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, -0.5, 'B', 3)
    };

    // Adjust y to center the selection sensitivity
    y += this.lineSpacing / 8;

    // Find closest note position
    const positions = {...treblePositions, ...bassPositions};
    let closestPosition = Object.keys(positions).reduce((a, b) => {
        return Math.abs(b - y) < Math.abs(a - y) ? b : a;
    });

    // Only trigger if click is close enough to a note position
    if (Math.abs(closestPosition - y) < this.lineSpacing / 2) {
        return positions[closestPosition];
    }

    return null;
}

    initAudio() {
        if (this.audioContext) return;
        
        // Create audio context with iOS-compatible options
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        
        // iOS Safari specific setup
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (iOS) {
            // Create a silent buffer and play it to unlock the audio
            const silentBuffer = new AudioContext().createBuffer(1, 1, 22050);
            const source = new AudioContext().createBufferSource();
            source.buffer = silentBuffer;
            source.connect(new AudioContext().destination);
            source.start(0);
            // Only after the silent buffer, create the real audio context
            setTimeout(() => {
                this.audioContext = new AudioContext({
                    sampleRate: 44100,
                    latencyHint: 'interactive'
                });
            }, 100);
        } else {
            // Non-iOS setup
            this.audioContext = new AudioContext({
                latencyHint: 'interactive',
                sampleRate: 44100
            });
        }
    }

    playNote(frequency) {
        // Make sure audio context exists and is running
        if (!this.audioContext) {
            this.initAudio();
            // Wait a bit for iOS audio context to initialize
            setTimeout(() => this.playNote(frequency), 200);
            return;
        }

        // Resume audio context if suspended (required for iOS)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.5);
    }
}

// Initialize the musical staff when the page loads
window.addEventListener('load', () => {
    new MusicalStaff();
}); 