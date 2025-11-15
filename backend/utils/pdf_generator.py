import logging
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import qrcode
from io import BytesIO

logger = logging.getLogger(__name__)

class PDFGenerator:
    """Generate PDF reports for search results"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#6366f1'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#4f46e5'),
            spaceBefore=20,
            spaceAfter=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='RiskScore',
            parent=self.styles['Normal'],
            fontSize=48,
            textColor=colors.HexColor('#dc2626'),
            alignment=TA_CENTER,
            spaceAfter=10
        ))
    
    def generate_report(self, result_data: Dict[str, Any], output_path: str) -> str:
        """
        Generate PDF report from search results
        
        Args:
            result_data: Search result dictionary
            output_path: Path to save PDF
            
        Returns:
            Path to generated PDF
        """
        try:
            doc = SimpleDocTemplate(output_path, pagesize=letter)
            story = []
            
            # Header
            story.append(Paragraph("Past Matters", self.styles['CustomTitle']))
            story.append(Paragraph("Background Verification Report", self.styles['Heading3']))
            story.append(Spacer(1, 0.3*inch))
            
            # Subject Information
            story.append(Paragraph("Subject Information", self.styles['SectionTitle']))
            subject_data = [
                ['Name:', result_data['subject']['name']],
                ['Date of Birth:', result_data['subject']['dob']],
                ['Photo Matched:', 'Yes' if result_data['subject']['photo_matched'] else 'No'],
                ['Report Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
            ]
            subject_table = Table(subject_data, colWidths=[2*inch, 4*inch])
            subject_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            story.append(subject_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Risk Score
            story.append(Paragraph("Risk Assessment", self.styles['SectionTitle']))
            risk_score = result_data['risk_score']
            story.append(Paragraph(str(risk_score['overall_score']), self.styles['RiskScore']))
            story.append(Paragraph(
                f"<b>{risk_score['risk_category'].upper()} RISK</b>",
                self.styles['Heading3']
            ))
            story.append(Paragraph(
                f"Confidence Level: {risk_score['confidence_level']}%",
                self.styles['Normal']
            ))
            story.append(Spacer(1, 0.2*inch))
            
            # Score Breakdown
            breakdown_data = [
                ['Category', 'Score'],
                ['Legal Risk', str(risk_score['breakdown']['legal_score'])],
                ['Relationship Patterns', str(risk_score['breakdown']['relationship_score'])],
                ['Social Behavior', str(risk_score['breakdown']['social_behavior_score'])]
            ]
            breakdown_table = Table(breakdown_data, colWidths=[3*inch, 2*inch])
            breakdown_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
            ]))
            story.append(breakdown_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Contributing Factors
            story.append(Paragraph("Key Findings", self.styles['SectionTitle']))
            for i, factor in enumerate(risk_score['contributing_factors'], 1):
                story.append(Paragraph(f"{i}. {factor}", self.styles['Normal']))
                story.append(Spacer(1, 0.1*inch))
            
            story.append(Spacer(1, 0.3*inch))
            
            # Court Cases
            if result_data.get('court_cases'):
                story.append(Paragraph("Court Records", self.styles['SectionTitle']))
                story.append(Paragraph(
                    f"Total Cases Found: {len(result_data['court_cases'])}",
                    self.styles['Normal']
                ))
                story.append(Spacer(1, 0.1*inch))
                
                for case in result_data['court_cases']:
                    case_data = [
                        ['Case Number:', case['case_number']],
                        ['Type:', case['case_type']],
                        ['Filed:', case['filing_date']],
                        ['Status:', case['status']],
                        ['Court:', case['court_name']],
                        ['Severity:', f"{case['severity_score']}/10"]
                    ]
                    case_table = Table(case_data, colWidths=[1.5*inch, 4.5*inch])
                    case_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fee2e2')),
                        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
                    ]))
                    story.append(case_table)
                    story.append(Spacer(1, 0.2*inch))
            else:
                story.append(Paragraph("Court Records", self.styles['SectionTitle']))
                story.append(Paragraph("No court cases found", self.styles['Normal']))
                story.append(Spacer(1, 0.2*inch))
            
            # Social Profiles
            if result_data.get('social_profiles'):
                story.append(Paragraph("Social & Dating Profiles", self.styles['SectionTitle']))
                story.append(Paragraph(
                    f"Total Profiles Found: {len(result_data['social_profiles'])}",
                    self.styles['Normal']
                ))
                story.append(Spacer(1, 0.1*inch))
                
                for profile in result_data['social_profiles'][:5]:  # Limit to 5 profiles
                    profile_text = f"<b>{profile['platform']}</b><br/>"
                    profile_text += f"URL: {profile['profile_url']}<br/>"
                    if profile.get('created_date'):
                        profile_text += f"Created: {profile['created_date']}<br/>"
                    profile_text += f"Status Changes: {len(profile.get('relationship_status_history', []))}"
                    
                    story.append(Paragraph(profile_text, self.styles['Normal']))
                    story.append(Spacer(1, 0.15*inch))
            
            # Footer
            story.append(Spacer(1, 0.5*inch))
            story.append(Paragraph(
                "<i>This report is generated from publicly available information. "
                "Accuracy depends on data source availability and freshness.</i>",
                self.styles['Normal']
            ))
            
            # Build PDF
            doc.build(story)
            logger.info(f"PDF report generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            raise
    
    def generate_qr_code(self, data: str) -> BytesIO:
        """Generate QR code for result URL"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer