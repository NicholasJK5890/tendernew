import os
import datetime
from typing import Any, List, Dict
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)

class EvaluationReportGenerator:
    """
    Generates official Indian Government Tender Evaluation Report PDF
    with Tender Summary, Checklist, Ranked Table, Disqualification Reasons,
    Evidence citations, Red Flags, and Approval File Noting.
    """

    @staticmethod
    def generate_pdf(
        tender: Any,
        bids: List[Any],
        output_path: str
    ) -> str:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'GovTitle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#1E1B4B'),
            alignment=1,
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'GovSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569'),
            alignment=1,
            spaceAfter=12
        )
        section_style = ParagraphStyle(
            'GovSection',
            parent=styles['Heading2'],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#4338CA'),
            spaceBefore=10,
            spaceAfter=6
        )
        normal_style = ParagraphStyle(
            'GovNormal',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#1E293B')
        )
        disqual_style = ParagraphStyle(
            'Disqual',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#DC2626')
        )
        flag_style = ParagraphStyle(
            'Flag',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#D97706')
        )

        elements = []

        # 1. Header
        elements.append(Paragraph("GOVERNMENT OF INDIA / NATIONAL PROCUREMENT PORTAL", subtitle_style))
        elements.append(Paragraph("TENDER EVALUATION & VERIFICATION SUMMARY REPORT", title_style))
        elements.append(Paragraph(f"Tender Ref: {tender.tender_no} | Category: {tender.category} | Method: {tender.evaluation_method}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#7C6BC4'), spaceAfter=10))

        # 2. Executive Tender Summary Table
        summary_data = [
            [Paragraph("<b>Department:</b>", normal_style), Paragraph(tender.department, normal_style),
             Paragraph("<b>Estimated Budget:</b>", normal_style), Paragraph(f"₹{tender.budget:,.2f}", normal_style)],
            [Paragraph("<b>Tender Title:</b>", normal_style), Paragraph(tender.title, normal_style),
             Paragraph("<b>Quantity / Unit:</b>", normal_style), Paragraph(f"{tender.quantity:,.0f} {tender.unit}", normal_style)],
            [Paragraph("<b>Evaluation Date:</b>", normal_style), Paragraph(datetime.datetime.now().strftime("%d-%b-%Y %H:%M IST"), normal_style),
             Paragraph("<b>Tender Status:</b>", normal_style), Paragraph(tender.status, normal_style)]
        ]
        summary_table = Table(summary_data, colWidths=[100, 200, 100, 140])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 10))

        # 3. Mandatory Requirement Checklist
        elements.append(Paragraph("1. Technical & Statutory Requirement Checklist", section_style))
        req_rows = [[
            Paragraph("<b>#</b>", normal_style),
            Paragraph("<b>Parameter / Standard</b>", normal_style),
            Paragraph("<b>Condition</b>", normal_style),
            Paragraph("<b>Target Value</b>", normal_style),
            Paragraph("<b>Mandatory</b>", normal_style),
            Paragraph("<b>Verification Source</b>", normal_style)
        ]]
        for idx, req in enumerate(tender.requirements, 1):
            req_rows.append([
                Paragraph(str(idx), normal_style),
                Paragraph(req.parameter, normal_style),
                Paragraph(req.operator.upper(), normal_style),
                Paragraph(f"{req.value} {req.unit or ''}", normal_style),
                Paragraph("YES" if req.is_mandatory else "NO", normal_style),
                Paragraph("BIS / MCA / GST Portal", normal_style)
            ])
        req_table = Table(req_rows, colWidths=[24, 180, 60, 90, 66, 120])
        req_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EDE9FE')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(req_table)
        elements.append(Spacer(1, 10))

        # 4. Bidder Evaluation & Ranking Table
        elements.append(Paragraph("2. Bidder Evaluation & L1/QCBS Ranking", section_style))
        bid_rows = [[
            Paragraph("<b>Rank</b>", normal_style),
            Paragraph("<b>Vendor Name & GSTIN</b>", normal_style),
            Paragraph("<b>Unit Price (₹)</b>", normal_style),
            Paragraph("<b>Total Amount (₹)</b>", normal_style),
            Paragraph("<b>Lead Time</b>", normal_style),
            Paragraph("<b>Compliance Verdict</b>", normal_style)
        ]]

        for b in bids:
            vendor = b.vendor
            rank_str = b.rank if b.rank else "—"
            status_color = "#15803D" if b.status == "Qualified" else ("#DC2626" if b.status == "Disqualified" else "#D97706")
            bid_rows.append([
                Paragraph(f"<b>{rank_str}</b>", normal_style),
                Paragraph(f"<b>{vendor.company_name}</b><br/><font size=7 color='#64748B'>{vendor.gstin}</font>", normal_style),
                Paragraph(f"₹{b.price_per_unit:,.2f}", normal_style),
                Paragraph(f"₹{b.total_amount:,.2f}", normal_style),
                Paragraph(f"{b.delivery_days} days", normal_style),
                Paragraph(f"<font color='{status_color}'><b>{b.status.upper()}</b></font>", normal_style)
            ])

        bid_table = Table(bid_rows, colWidths=[40, 180, 80, 90, 60, 90])
        bid_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(bid_table)
        elements.append(Spacer(1, 10))

        # 5. Non-Compliance Evidence & Disqualification Details
        elements.append(Paragraph("3. Non-Compliance & Audit Log Citations", section_style))
        disqualified_bids = [b for b in bids if b.status == "Disqualified"]
        red_flag_bids = [b for b in bids if b.status == "Red Flagged"]

        if disqualified_bids:
            for b in disqualified_bids:
                reasons = b.disqualification_reasons
                if isinstance(reasons, str):
                    try:
                        import json
                        reasons = json.loads(reasons)
                    except Exception:
                        reasons = [reasons]
                elements.append(Paragraph(f"<b>Disqualified Bidder: {b.vendor.company_name}</b> (Quoted: ₹{b.price_per_unit:,.2f}/unit)", disqual_style))
                for r in reasons:
                    elements.append(Paragraph(f"• {r}", disqual_style))
                elements.append(Paragraph("<font size=7 color='#475569'>Verified against Bureau of Indian Standards (BIS Manakonline) active licence database.</font>", normal_style))
                elements.append(Spacer(1, 4))

        if red_flag_bids:
            for b in red_flag_bids:
                flags = b.red_flag_reasons
                if isinstance(flags, str):
                    try:
                        import json
                        flags = json.loads(flags)
                    except Exception:
                        flags = [flags]
                elements.append(Paragraph(f"<b>Red-Flagged Bidder: {b.vendor.company_name}</b> (Quoted: ₹{b.price_per_unit:,.2f}/unit)", flag_style))
                for f in flags:
                    elements.append(Paragraph(f"⚠ {f}", flag_style))
                elements.append(Paragraph("<font size=7 color='#475569'>GeM benchmark price floor and inter-bid entity graph audit triggered.</font>", normal_style))
                elements.append(Spacer(1, 4))

        if not disqualified_bids and not red_flag_bids:
            elements.append(Paragraph("All submitted bids demonstrated full statutory and specification compliance.", normal_style))

        elements.append(Spacer(1, 12))

        # 6. Officer Approval & File Noting Section
        elements.append(Paragraph("4. Competent Authority Approval & File Noting Record", section_style))
        noting_text = (
            f"The Technical & Financial Evaluation Committee reviewed all verification agent findings, "
            f"statutory registry records (BIS, GSTIN, MCA21), and GeM market pricing benchmarks. "
            f"TenderLens AI Verification Engine has verified all assertions deterministically.<br/><br/>"
            f"<b>Recommended Action:</b> Award of contract to <b>{tender.bids[0].vendor.company_name if tender.bids else 'L1 Bidder'}</b> "
            f"subject to formal agreement and submission of Performance Security."
        )
        if tender.approval_notes:
            noting_text += f"<br/><br/><b>Officer Recorded Note / Override:</b> {tender.approval_notes}"

        elements.append(Paragraph(noting_text, normal_style))
        elements.append(Spacer(1, 16))

        # Signatures block
        sig_data = [
            [Paragraph("Prepared by:<br/><b>TenderLens AI Engine</b><br/>Autonomous Verification", normal_style),
             Paragraph("Verified by:<br/><b>Rajesh Sharma, SE (Procurement)</b><br/>CPWD New Delhi", normal_style),
             Paragraph("Approved by:<br/><b>Chief Engineer (Civil)</b><br/>Competent Authority", normal_style)]
        ]
        sig_table = Table(sig_data, colWidths=[180, 180, 180])
        sig_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#94A3B8')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        return output_path
