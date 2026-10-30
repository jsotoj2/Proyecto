/* Formulario A4 vectorial, preparado para imprimir y completar a mano. */
window.BecasPDF = {
  crearFormulario(beca) {
    if (!window.jspdf?.jsPDF) throw new Error('No se pudo cargar la biblioteca PDF. Revisa tu conexión.');
    const pdf = new window.jspdf.jsPDF({unit:'mm',format:'a4'});
    const verde=[18,62,57], tinta=[32,56,49], gris=[99,115,107], borde=[210,222,215];
    const limpio = texto => String(texto ?? '').replace(/&(amp|lt|gt|quot|#39);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[v]));
    const texto=(value,x,y,size=10,color=tinta,bold=false)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color);pdf.text(value,x,y);};
    pdf.setProperties({title:'Solicitud de beca - '+limpio(beca.nombre),subject:'Formulario de postulación',author:'Becas Nacionales'});
    pdf.setFillColor(...verde);pdf.rect(0,0,210,48,'F');
    pdf.setFillColor(219,234,169);pdf.roundedRect(16,13,13,13,3,3,'F');texto('B',20,22,18,verde,true);
    texto('BECAS NACIONALES',34,18,10,[219,234,169],true);
    texto('Solicitud de beca',34,29,23,[255,255,255],true);
    texto('FORMULARIO DE POSTULACIÓN',16,41,8,[202,222,211]);
    texto('Completa con letra clara. Revisa tus datos antes de enviar tu solicitud.',16,58,9,gris);
    pdf.setFillColor(239,245,234);pdf.roundedRect(16,65,178,25,3,3,'F');
    texto('PROGRAMA SELECCIONADO',22,73,8,gris,true);
    pdf.setFont('helvetica','bold');pdf.setFontSize(13);
    const nombre=pdf.splitTextToSize(limpio(beca.nombre),165).slice(0,2);
    texto(nombre,22,80,13,tinta,true);
    const section=(n,title,y)=>{pdf.setFillColor(...verde);pdf.roundedRect(16,y-5,7,7,1.5,1.5,'F');texto(n,18,y,9,[255,255,255],true);texto(title,27,y,12,tinta,true);pdf.setDrawColor(...borde);pdf.line(16,y+5,194,y+5);};
    const field=(label,x,y,width)=>{texto(label,x,y,8,gris,true);pdf.setDrawColor(...borde);pdf.setLineWidth(.25);pdf.roundedRect(x,y+3,width,11,1.5,1.5,'S');};
    section('01','Datos personales',102);
    field('Nombre completo',16,115,178);
    field('DPI / CUI (13 dígitos)',16,137,85);field('Edad',109,137,30);field('Teléfono',147,137,47);
    field('Correo electrónico',16,159,178);
    field('Dirección de residencia',16,181,178);
    section('02','Información académica',211);
    field('Últimos estudios',16,224,125);field('Promedio',149,224,45);
    section('03','Motivo de la solicitud',254);
    texto('Explica por qué solicitas esta beca y cómo contribuirá a tus metas.',16,266,9,gris);
    // Segunda página para dar espacio real a la motivación y firma.
    pdf.setFontSize(8);pdf.setTextColor(...gris);pdf.text('Continúa en la página siguiente',194,276,{align:'right'});
    pdf.addPage();
    pdf.setFillColor(...verde);pdf.rect(0,0,210,32,'F');texto('Solicitud de beca',16,17,18,[255,255,255],true);texto('Motivación y confirmación',16,26,9,[202,222,211]);
    texto('03',16,46,10,verde,true);texto('Motivo de la solicitud (continuación)',27,46,13,tinta,true);
    texto('Describe tus metas académicas, tu situación y el apoyo que necesitas.',16,56,9,gris);
    pdf.setDrawColor(...borde);pdf.roundedRect(16,64,178,116,3,3,'S');
    for(let y=76;y<180;y+=12)pdf.line(22,y,188,y);
    section('04','Confirmación del aspirante',199);
    texto(pdf.splitTextToSize('Confirmo que la información proporcionada es correcta. Este formulario no garantiza la asignación de una beca; la solicitud estará sujeta a revisión.',178),16,214,10,gris);
    pdf.setDrawColor(...borde);pdf.line(16,247,123,247);pdf.line(137,247,194,247);
    texto('Firma del aspirante',16,254,9,gris);texto('Fecha (día / mes / año)',137,254,9,gris);
    pdf.setFillColor(239,245,234);pdf.roundedRect(16,264,178,13,2,2,'F');texto('Conserva una copia y consulta las instrucciones de entrega en la plataforma.',21,272,8,verde);
    for(let page=1;page<=2;page++){pdf.setPage(page);pdf.setDrawColor(...borde);pdf.line(16,281,194,281);texto('Becas Nacionales  /  Solicitud de beca',16,289,8,gris);pdf.setFontSize(8);pdf.text(`${page} / 2`,194,289,{align:'right'});}
    return pdf;
  }
};
