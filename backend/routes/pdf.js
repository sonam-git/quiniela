const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const Bet = require('../models/Bet');
const User = require('../models/User');

// Helper: Get prediction symbol
const getPrediction = (prediction) => {
  switch(prediction) {
    case 'teamA': return 'L';
    case 'teamB': return 'V';
    case 'draw': return 'E';
    default: return '-';
  }
};

// Generate Prediction PDF (before games start) - All participants
router.get('/prediction/:weekNumber/:year', auth, async (req, res) => {
  try {
    const { weekNumber, year } = req.params;
    
    // Get schedule
    const schedule = await Schedule.findOne({ 
      weekNumber: parseInt(weekNumber), 
      year: parseInt(year) 
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Get all bets for this week
    const allBets = await Bet.find({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year),
      isPlaceholder: { $ne: true }
    }).populate('userId', 'name').sort({ 'userId.name': 1 });
    
    if (allBets.length === 0) {
      return res.status(404).json({ message: 'No predictions found for this week' });
    }
    
    // Create PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      layout: 'landscape',
      margin: 30,
      info: {
        Title: `Quiniela Predictions - Jornada ${schedule.jornada || weekNumber}`,
        Author: 'Quiniela Liga MX'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=predictions-jornada-${schedule.jornada || weekNumber}-${year}.pdf`);
    
    // Pipe to response
    doc.pipe(res);
    
    // Header
    doc.fillColor('#10b981')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('QUINIELA', 30, 30, { align: 'center', width: 787 });
    
    doc.fillColor('#333333')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(`Jornada ${schedule.jornada || weekNumber} - Predictions`, 30, 58, { align: 'center', width: 787 });
    
    const generatedAt = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Clausura ${year} | Generated: ${generatedAt}`, 30, 78, { align: 'center', width: 787 });
    
    // Table setup
    const startX = 30;
    const startY = 105;
    const headerRowHeight = 32; // Taller for two-line team names
    const dataRowHeight = 22;   // Normal height for data rows
    const colWidths = [120, 58, 58, 58, 58, 58, 58, 58, 58, 58, 50, 55];
    // Columns: Name, M1, M2, M3, M4, M5, M6, M7, M8, M9, Goals, Paid
    
    let y = startY;
    
    // Table Header - Match names (green bar)
    doc.fillColor('#10b981')
       .rect(startX, y, 787, headerRowHeight)
       .fill();
    
    let x = startX;
    doc.fillColor('#ffffff')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Player', x + 5, y + 11, { width: colWidths[0] - 10, lineBreak: false });
    x += colWidths[0];
    
    // Match headers (shortened team names - two lines)
    schedule.matches.forEach((match, i) => {
      const teamA = match.teamA.replace('Club ', '').replace('CF ', '').replace('Deportivo ', '').substring(0, 6);
      const teamB = match.teamB.replace('Club ', '').replace('CF ', '').replace('Deportivo ', '').substring(0, 6);
      doc.fillColor('#ffffff')
         .fontSize(7)
         .text(teamA, x + 2, y + 6, { width: colWidths[i + 1] - 4, align: 'center', lineBreak: false });
      doc.text(`vs ${teamB}`, x + 2, y + 18, { width: colWidths[i + 1] - 4, align: 'center', lineBreak: false });
      x += colWidths[i + 1];
    });
    
    doc.fontSize(8)
       .text('Goals', x + 2, y + 11, { width: colWidths[10] - 4, align: 'center', lineBreak: false });
    x += colWidths[10];
    doc.text('Paid', x + 2, y + 11, { width: colWidths[11] - 4, align: 'center', lineBreak: false });
    
    y += headerRowHeight;
    
    // Data rows
    allBets.forEach((bet, rowIndex) => {
      const bgColor = rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff';
      
      doc.fillColor(bgColor)
         .rect(startX, y, 787, dataRowHeight)
         .fill();
      
      x = startX;
      
      // Player name
      doc.fillColor('#333333')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(bet.userId?.name || 'Unknown', x + 5, y + 6, { width: colWidths[0] - 10, lineBreak: false });
      x += colWidths[0];
      
      // Predictions for each match
      doc.font('Helvetica').fontSize(10);
      schedule.matches.forEach((match, i) => {
        const prediction = bet.predictions.find(p => p.matchId.toString() === match._id.toString());
        const pred = prediction ? getPrediction(prediction.prediction) : '-';
        
        // All predictions in black before games start
        doc.fillColor('#333333')
           .text(pred, x + 2, y + 6, { width: colWidths[i + 1] - 4, align: 'center', lineBreak: false });
        x += colWidths[i + 1];
      });
      
      // Total goals
      doc.fillColor('#333333')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(bet.totalGoals?.toString() || '-', x + 2, y + 6, { width: colWidths[10] - 4, align: 'center', lineBreak: false });
      x += colWidths[10];
      
      // Payment status - show "Paid" or "Pending" text
      const paidColor = bet.paid ? '#16a34a' : '#dc2626';
      const paidText = bet.paid ? 'Paid' : 'Pending';
      doc.fillColor(paidColor)
         .font('Helvetica-Bold')
         .fontSize(7)
         .text(paidText, x + 2, y + 7, { width: colWidths[11] - 4, align: 'center', lineBreak: false });
      
      y += dataRowHeight;
    });
    
    // Legend
    y += 20;
    doc.fillColor('#666666')
       .fontSize(9)
       .font('Helvetica')
       .text('L = Local (Home Win) | E = Empate (Draw) | V = Visitante (Away Win)', startX, y, { lineBreak: false });
    
    // Footer
    doc.fillColor('#999999')
       .fontSize(8)
       .text(`Total Participants: ${allBets.length} | Quiniela Liga MX`, startX, 550, { align: 'center', width: 787 });
    
    // Finalize
    doc.end();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// Generate Results PDF (after settlement) - All participants with results
router.get('/results/:weekNumber/:year', auth, async (req, res) => {
  try {
    const { weekNumber, year } = req.params;
    
    // Get schedule with settledBy admin info
    const schedule = await Schedule.findOne({ 
      weekNumber: parseInt(weekNumber), 
      year: parseInt(year) 
    }).populate('settledBy', 'name');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    if (!schedule.isSettled) {
      return res.status(400).json({ message: 'Week is not yet settled' });
    }
    
    // Get all bets for leaderboard
    const allBets = await Bet.find({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year),
      isPlaceholder: { $ne: true }
    }).populate('userId', 'name').sort({ totalPoints: -1, goalDifference: 1 });
    
    if (allBets.length === 0) {
      return res.status(404).json({ message: 'No predictions found for this week' });
    }
    
    // Create PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      layout: 'landscape',
      margin: 30,
      info: {
        Title: `Quiniela Results - Jornada ${schedule.jornada || weekNumber}`,
        Author: 'Quiniela Liga MX'
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=results-jornada-${schedule.jornada || weekNumber}-${year}.pdf`);
    
    // Pipe to response
    doc.pipe(res);
    
    // Header
    doc.fillColor('#10b981')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('QUINIELA', { align: 'center' });
    
    doc.fillColor('#333333')
       .fontSize(16)
       .text(`Jornada ${schedule.jornada || weekNumber} - Final Results`, { align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Clausura ${year} | Total Goals: ${schedule.actualTotalGoals}`, { align: 'center' });
    
    const generatedAt = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    doc.fontSize(9)
       .text(`Generated: ${generatedAt}`, { align: 'center' });
    
    doc.moveDown(0.3);
    
    // Actual Results Row
    const startX = 30;
    let y = doc.y + 5;
    const resultsRowHeight = 24;
    const headerRowHeight = 32; // Taller for two-line team names
    const dataRowHeight = 22;
    const colWidths = [80, 58, 58, 58, 58, 58, 58, 58, 58, 58, 45, 45, 50];
    // Columns: Rank/Name, M1-M9, Goals, Pts, Paid
    
    // Match results header (blue bar - actual scores)
    doc.fillColor('#1e40af')
       .rect(startX, y, 787, resultsRowHeight)
       .fill();
    
    doc.fillColor('#ffffff')
       .fontSize(8)
       .font('Helvetica-Bold');
    
    let x = startX;
    doc.text('RESULTS', x + 5, y + 8, { width: colWidths[0] - 10, lineBreak: false });
    x += colWidths[0];
    
    // Actual match results
    schedule.matches.forEach((match, i) => {
      const result = getPrediction(match.result);
      doc.text(`${match.scoreTeamA}-${match.scoreTeamB} (${result})`, x + 2, y + 8, { width: colWidths[i + 1] - 4, align: 'center', lineBreak: false });
      x += colWidths[i + 1];
    });
    
    doc.text(schedule.actualTotalGoals?.toString() || '-', x + 2, y + 8, { width: colWidths[10] - 4, align: 'center', lineBreak: false });
    
    y += resultsRowHeight + 5;
    
    // Table Header (green bar - team names)
    doc.fillColor('#10b981')
       .rect(startX, y, 787, headerRowHeight)
       .fill();
    
    doc.fillColor('#ffffff')
       .fontSize(8)
       .font('Helvetica-Bold');
    
    x = startX;
    doc.text('Player', x + 5, y + 11, { width: colWidths[0] - 10, lineBreak: false });
    x += colWidths[0];
    
    // Match headers (two lines for team names)
    schedule.matches.forEach((match, i) => {
      const teamA = match.teamA.replace('Club ', '').replace('CF ', '').replace('Deportivo ', '').substring(0, 6);
      const teamB = match.teamB.replace('Club ', '').replace('CF ', '').replace('Deportivo ', '').substring(0, 6);
      doc.fontSize(7)
         .text(teamA, x + 2, y + 6, { width: colWidths[i + 1] - 4, align: 'center', lineBreak: false });
      doc.text(`vs ${teamB}`, x + 2, y + 18, { width: colWidths[i + 1] - 4, align: 'center', lineBreak: false });
      x += colWidths[i + 1];
    });
    
    doc.fontSize(8)
       .text('Goals', x + 2, y + 11, { width: colWidths[10] - 4, align: 'center', lineBreak: false });
    x += colWidths[10];
    doc.text('Pts', x + 2, y + 11, { width: colWidths[11] - 4, align: 'center', lineBreak: false });
    x += colWidths[11];
    doc.text('Paid', x + 2, y + 11, { width: colWidths[12] - 4, align: 'center', lineBreak: false });
    
    y += headerRowHeight;
    
    // Track rank - winners all get rank 1
    let currentRank = 1;
    let displayRank = 1;
    
    // Data rows - sorted by points
    allBets.forEach((bet, rowIndex) => {
      const isWinner = bet.isWinner;
      const bgColor = isWinner ? '#fef3c7' : (rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff');
      
      doc.fillColor(bgColor)
         .rect(startX, y, 787, dataRowHeight)
         .fill();
      
      x = startX;
      
      // Player name with rank - all winners get rank 1
      if (isWinner) {
        displayRank = 1;
      } else {
        // Count how many winners came before to adjust rank
        const winnersCount = allBets.slice(0, rowIndex).filter(b => b.isWinner).length;
        displayRank = rowIndex + 1 - winnersCount + 1;
      }
      
      doc.fillColor('#333333')
         .fontSize(8)
         .font('Helvetica-Bold')
         .text(`${displayRank}. ${bet.userId?.name || 'Unknown'}`, x + 3, y + 6, { width: colWidths[0] - 6, lineBreak: false });
      x += colWidths[0];
      
      // Predictions with correct/wrong indicator (green for correct, red for wrong)
      doc.font('Helvetica').fontSize(9);
      schedule.matches.forEach((match, i) => {
        const prediction = bet.predictions.find(p => p.matchId.toString() === match._id.toString());
        const pred = prediction ? getPrediction(prediction.prediction) : '-';
        const isCorrect = prediction && prediction.prediction === match.result;
        
        // Green text for correct, red text for wrong
        const predColor = isCorrect ? '#16a34a' : '#dc2626';
        doc.fillColor(predColor)
           .text(pred, x + 2, y + 6, { width: colWidths[i + 1] - 4, align: 'center', lineBreak: false });
        x += colWidths[i + 1];
      });
      
      // Total goals
      const goalDiff = bet.goalDifference !== null ? ` (${bet.goalDifference})` : '';
      doc.fillColor('#333333')
         .font('Helvetica')
         .fontSize(8)
         .text(`${bet.totalGoals}${goalDiff}`, x + 2, y + 6, { width: colWidths[10] - 4, align: 'center', lineBreak: false });
      x += colWidths[10];
      
      // Points
      doc.fillColor('#10b981')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(bet.totalPoints?.toString() || '0', x + 2, y + 5, { width: colWidths[11] - 4, align: 'center', lineBreak: false });
      x += colWidths[11];
      
      // Payment status - show "Paid" or "Pending" text
      const paidColor = bet.paid ? '#16a34a' : '#dc2626';
      const paidText = bet.paid ? 'Paid' : 'Pending';
      doc.fillColor(paidColor)
         .font('Helvetica-Bold')
         .fontSize(7)
         .text(paidText, x + 2, y + 7, { width: colWidths[12] - 4, align: 'center', lineBreak: false });
      
      y += dataRowHeight;
    });
    
    // Legend
    y += 10;
    doc.fillColor('#666666')
       .fontSize(8)
       .font('Helvetica')
       .text('L = Local (Home) | E = Empate (Draw) | V = Visitante (Away) | Green = Correct | Red = Wrong | Yellow Row = Winner | (n) = Goal Difference', startX, y);
    
    // Approved and Verified by Admin
    y += 20;
    const settledByName = schedule.settledBy?.name || 'Admin';
    const settledAtFormatted = schedule.settledAt 
      ? new Date(schedule.settledAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : 'N/A';
    
    doc.fillColor('#10b981')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(`✓ Approved and Verified by: ${settledByName}`, startX, y, { continued: true });
    doc.fillColor('#666666')
       .font('Helvetica')
       .text(` | ${settledAtFormatted}`, { lineBreak: false });
    
    // Footer
    doc.fillColor('#999999')
       .fontSize(8)
       .font('Helvetica')
       .text(`Total Participants: ${allBets.length} | Winner(s): ${allBets.filter(b => b.isWinner).map(b => b.userId?.name).join(', ') || 'TBD'}`, startX, 550, { align: 'center', width: 787 });
    
    // Finalize
    doc.end();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

module.exports = router;
