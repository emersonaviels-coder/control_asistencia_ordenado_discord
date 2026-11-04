// Vercel Serverless Function: api/notify.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { grupoId, grupoNombre, categoriaKey, fecha, asistencia } = req.body;

    const webhookUrl = process.env.DISCORD_WEBHOOK_PARVULARIA || "https://discord.com/api/webhooks/1567175256123248763/vvMkuXD1qIpaigUUjWaH9ybECQK7iDRXkifOFiRb6hQAfGbVdbQL_ivQSaupOkjHNBzE";

    let puntuales = [], tardes = [], ausentes = [];
    if (asistencia) {
      Object.entries(asistencia).forEach(([nombre, estado]) => {
        if (estado === 'puntual') puntuales.push(nombre);
        else if (estado === 'tarde') tardes.push(nombre);
        else if (estado === 'ausente') ausentes.push(nombre);
      });
    }

    const embed = {
      title: `📋 Reporte de Asistencia: ${grupoNombre || 'Grupo'}`,
      color: 0x007AFF,
      timestamp: new Date().toISOString(),
      fields: [
        { name: '📅 Fecha', value: fecha || new Date().toLocaleDateString('es-ES'), inline: true },
        { name: '📊 Total Alumnos', value: `${Object.keys(asistencia || {}).length}`, inline: true },
        { name: '✅ Puntuales (' + puntuales.length + ')', value: puntuales.join('\n') || 'Ninguno', inline: false },
        { name: '⚠️ Tardanzas (' + tardes.length + ')', value: tardes.join('\n') || 'Ninguna', inline: false },
        { name: '❌ Ausentes (' + ausentes.length + ')', value: ausentes.join('\n') || 'Ninguno', inline: false },
      ],
      footer: {
        text: 'Sistema de Control de Asistencia Estudiantil',
      }
    };

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    return res.status(200).json({ success: true, message: 'Notificación enviada a Discord' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
