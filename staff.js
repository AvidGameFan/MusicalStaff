class MusicalStaff {
    constructor() {
        this.canvas = document.getElementById('staff');
        this.ctx = this.canvas.getContext('2d');
        this.noteDisplay = document.getElementById('note-display');
        
        // Set canvas size with proper scaling
        this.canvas.style.width = '800px';
        this.canvas.style.height = '400px';
        this.canvas.width = 800 * window.devicePixelRatio;
        this.canvas.height = 400 * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        this.noteRadius = 8;
        this.lineSpacing = 15;
        this.staffX = 60;
        this.trebleStaffY = 100;  // Moved down to accommodate ledger lines
        this.bassStaffY = 250;    // Moved down to accommodate ledger lines
        this.staffWidth = 700;
        
        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Set up click handling
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // Store active notes for visual feedback
        this.activeNotes = [];
        
        // Draw initial staff
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawClefs();
        this.drawStaffLines(this.trebleStaffY); // Treble staff
        this.drawStaffLines(this.bassStaffY);   // Bass staff
        this.drawActiveNotes();
    }

    drawClefs() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '60px serif';
        // Treble clef (G clef)
        this.ctx.fillText('𝄞', 20, this.trebleStaffY + 50);
        // Bass clef (F clef)
        this.ctx.fillText('𝄢', 20, this.bassStaffY + 55);
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
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Scale coordinates based on canvas size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const canvasX = x * scaleX / window.devicePixelRatio;
        const canvasY = y * scaleY / window.devicePixelRatio;

        // Check if click is within staff area
        if (canvasX >= this.staffX && canvasX <= this.staffX + this.staffWidth) {
            const result = this.getFrequencyFromPosition(canvasY);
            if (result) {
                this.playNote(result.frequency);
                this.activeNotes.push({
                    x: canvasX,
                    y: result.y,  // Use the calculated staff position instead of click position
                    timestamp: performance.now()
                });
                
                // Update note display
                this.noteDisplay.textContent = `${result.noteName} (${Math.round(result.frequency)} Hz)`;
                
                this.draw();
            }
        }
    }

    getFrequencyFromPosition(y) {
        // Define note frequencies (A4 = 440Hz as reference)
        const A4 = 440;
        const notes = {
            'C4': A4 * Math.pow(2, -9/12),
            'D4': A4 * Math.pow(2, -7/12),
            'E4': A4 * Math.pow(2, -5/12),
            'F4': A4 * Math.pow(2, -4/12),
            'G4': A4 * Math.pow(2, -2/12),
            'A4': A4,
            'B4': A4 * Math.pow(2, 2/12),
            'C5': A4 * Math.pow(2, 3/12),
            'D5': A4 * Math.pow(2, 5/12),
            'E5': A4 * Math.pow(2, 7/12),
            'F5': A4 * Math.pow(2, 8/12),
            'G5': A4 * Math.pow(2, 10/12),
            'A5': A4 * Math.pow(2, 12/12),
            // Add bass clef notes
            'F2': A4 * Math.pow(2, -28/12),
            'G2': A4 * Math.pow(2, -26/12),
            'A2': A4 * Math.pow(2, -24/12),
            'B2': A4 * Math.pow(2, -22/12),
            'C3': A4 * Math.pow(2, -21/12),
            'D3': A4 * Math.pow(2, -19/12),
            'E3': A4 * Math.pow(2, -17/12),
            'F3': A4 * Math.pow(2, -16/12),
            'G3': A4 * Math.pow(2, -14/12),
            'A3': A4 * Math.pow(2, -12/12),
            'B3': A4 * Math.pow(2, -10/12)

        };

        // Helper function to get note position and frequency
        const getNoteInfo = (staffY, position, frequency, noteName) => ({
            y: staffY + position * this.lineSpacing,
            frequency: frequency,
            noteName: noteName
        });

        // Map Y position to note frequencies (from bottom to top for each staff)
        const treblePositions = {
            // Lines (from bottom to top)
            
            [this.trebleStaffY + 5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 5, notes.C4, 'C4'),
            [this.trebleStaffY + 4 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 4, notes.E4, 'E4'),
            [this.trebleStaffY + 3 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 3, notes.G4, 'G4'),
            [this.trebleStaffY + 2 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 2, notes.B4, 'B4'),
            [this.trebleStaffY + this.lineSpacing]: getNoteInfo(this.trebleStaffY, 1, notes.D5, 'D5'),
            [this.trebleStaffY]: getNoteInfo(this.trebleStaffY, 0, notes.F5, 'F5'),
            [this.trebleStaffY - 1* this.lineSpacing]: getNoteInfo(this.trebleStaffY, -1, notes.A5, 'A5'),
            // Spaces (from bottom to top)
            [this.trebleStaffY + 4.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 4.5, notes.D4, 'D4'),
            [this.trebleStaffY + 3.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 3.5, notes.F4, 'F4'),
            [this.trebleStaffY + 2.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 2.5, notes.A4, 'A4'),
            [this.trebleStaffY + 1.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 1.5, notes.C5, 'C5'),
            [this.trebleStaffY + 0.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, 0.5, notes.E5, 'E5'),
            [this.trebleStaffY - 0.5 * this.lineSpacing]: getNoteInfo(this.trebleStaffY, -0.5, notes.G5, 'G5'),
        };

        const bassPositions = {
            // Lines (from bottom to top)
            [this.bassStaffY + 4 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 4, notes.G2, 'G2'),
            [this.bassStaffY + 3 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 3, notes.B2, 'B2'),
            [this.bassStaffY + 2 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 2, notes.D3, 'D3'),
            [this.bassStaffY + this.lineSpacing]: getNoteInfo(this.bassStaffY, 1, notes.F3, 'F3'),
            [this.bassStaffY]: getNoteInfo(this.bassStaffY, 0, notes.A3, 'A3'),  //A3 is the top line of the bass staff
            [this.bassStaffY - 1 * this.lineSpacing]: getNoteInfo(this.bassStaffY, -1, notes.C4, 'C4'),

            // Spaces (from bottom to top)
            [this.bassStaffY + 4.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 4.5, notes.F2, 'F2'),
            [this.bassStaffY + 3.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 3.5, notes.A2, 'A2'),
            [this.bassStaffY + 2.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 2.5, notes.C3, 'C3'),
            [this.bassStaffY + 1.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 1.5, notes.E3, 'E3'),
            [this.bassStaffY + 0.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY, 0.5, notes.G3, 'G3'),
            [this.bassStaffY - 0.5 * this.lineSpacing]: getNoteInfo(this.bassStaffY,-0.5, notes.B3, 'B3'),
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

    playNote(frequency) {
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