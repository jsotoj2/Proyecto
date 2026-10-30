const verBecaOriginal=AspiranteUI.verBeca;
AspiranteUI.verBeca=function(id){verBecaOriginal.call(this,id);const mensaje=document.getElementById('fase1Mensaje');if(mensaje){const grupo=document.createElement('div');grupo.className='form-group';grupo.innerHTML='<label for="formPdf">Documentación PDF (opcional, máximo 5 MB)</label><input id="formPdf" type="file" accept="application/pdf,.pdf">';mensaje.before(grupo);}};
const enviarOriginal=AspiranteUI.enviarFormulario;
AspiranteUI.enviarFormulario=async function(){
 const file=document.getElementById('formPdf')?.files[0];
 if(file){if(file.size>5*1024*1024||!file.name.toLowerCase().endsWith('.pdf')||await file.slice(0,5).text()!=='%PDF-')throw new Error('Adjunta un PDF válido de máximo 5 MB.');}
 const version=BecasData.version();await enviarOriginal.call(this);
 if(file&&BecasData.version()!==version){const solicitud=this.obtenerSolicitud();try{await BecasData.subirPdf(solicitud.id,file);}catch(e){throw new Error('El formulario se guardó, pero el PDF no pudo adjuntarse: '+e.message);}}
};
AspiranteUI.descargarFormulario=async function(id){
 const b=BecasData.obtener().becas.find(b=>b.id===id);if(!b)return;
 if(!window.jspdf?.jsPDF)throw new Error('No se pudo cargar la librería PDF. Revisa tu conexión a Internet.');
 const datos=BecasData.obtener();datos.descargas.push({usuario:usuarioActual.usuario,becaId:id,fecha:new Date().toISOString().slice(0,10)});await BecasData.guardar(datos);
 const pdf=new window.jspdf.jsPDF();pdf.text('Solicitud de beca',20,20);pdf.text(b.nombre,20,35);pdf.text('Nombre: ______________________________',20,55);pdf.text('DPI: _________________________________',20,70);pdf.text('Estudios: _____________________________',20,85);pdf.text('Promedio: _____________________________',20,100);pdf.text('Motivo: _______________________________',20,115);pdf.save('formulario-beca.pdf');
};
for(const objeto of [AspiranteUI,AdminUI,SuperAdminUI])for(const nombre of Object.keys(objeto))if(typeof objeto[nombre]==='function'){
 const original=objeto[nombre];if(original.constructor.name==='AsyncFunction')objeto[nombre]=async function(...args){const buttons=[...document.querySelectorAll('button:not([disabled])')];buttons.forEach(b=>b.disabled=true);try{return await original.apply(this,args);}catch(e){alert(e.message);}finally{buttons.forEach(b=>b.disabled=false);}};
}
