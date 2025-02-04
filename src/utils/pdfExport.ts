import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { convertDistance } from './distance';

interface Place {
  name: string;
  type: 'restaurant' | 'activity';
  address: string;
  distance: number;
  notes: string;
  visited: boolean;
  rating: number;
}

export const exportToPDF = (places: Place[], destination: string, distanceUnit: 'km' | 'mi') => {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString();

  // Add title
  doc.setFontSize(20);
  doc.text(`${destination} Trip Planner`, 14, 20);
  doc.setFontSize(12);
  doc.text(`Generated on ${today}`, 14, 30);

  // Separate places by type and visited status
  const restaurants = places.filter(place => place.type === 'restaurant');
  const activities = places.filter(place => place.type === 'activity');

  // Helper function to create rating text
  const createRatingText = (rating: number) => {
    return `${rating} star${rating === 1 ? '' : 's'}`;
  };

  // Helper function to create table data
  const createTableData = (places: Place[]) => {
    return places.map(place => [
      place.name,
      place.address,
      `${place.distance} ${distanceUnit}`,
      createRatingText(place.rating),
      place.visited ? 'Yes' : 'No',
      place.notes || '-'
    ]);
  };

  // Add Restaurants section
  doc.setFontSize(16);
  doc.text('Restaurants', 14, 40);
  
  autoTable(doc, {
    head: [['Name', 'Address', 'Distance', 'Rating', 'Visited', 'Notes']],
    body: createTableData(restaurants),
    startY: 45,
    styles: { 
      fontSize: 10,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [66, 133, 244],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 40 }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Add Activities section
  const activitiesY = (doc as any).lastAutoTable.finalY + 15;
  doc.text('Activities', 14, activitiesY);

  autoTable(doc, {
    head: [['Name', 'Address', 'Distance', 'Rating', 'Visited', 'Notes']],
    body: createTableData(activities),
    startY: activitiesY + 5,
    styles: { 
      fontSize: 10,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 40 }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  // Save the PDF
  doc.save(`${destination.toLowerCase()}-trip-planner.pdf`);
};