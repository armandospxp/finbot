import os
import sys
import argparse
import logging
from typing import List, Optional
from policy_knowledge_base import PolicyKnowledgeBase
from dotenv import load_dotenv
import PyPDF2

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extrae el texto de un archivo PDF
    
    Args:
        pdf_path: Ruta al archivo PDF
        
    Returns:
        Texto extraído del PDF
    """
    try:
        text = ""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            num_pages = len(reader.pages)
            
            for page_num in range(num_pages):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        
        return text
    except Exception as e:
        logger.error(f"Error al extraer texto del PDF {pdf_path}: {str(e)}")
        raise

def save_text_to_file(text: str, output_path: str) -> None:
    """Guarda el texto extraído en un archivo
    
    Args:
        text: Texto a guardar
        output_path: Ruta del archivo de salida
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as file:
            file.write(text)
        logger.info(f"Texto guardado en {output_path}")
    except Exception as e:
        logger.error(f"Error al guardar texto en {output_path}: {str(e)}")
        raise

def process_policy_document(pdf_path: str, policy_id: str, policy_name: str, chroma_dir: Optional[str] = None) -> int:
    """Procesa un documento de política de crédito y lo carga en la base de conocimiento
    
    Args:
        pdf_path: Ruta al archivo PDF
        policy_id: ID de la política
        policy_name: Nombre de la política
        chroma_dir: Directorio de la base de datos ChromaDB
        
    Returns:
        Número de chunks agregados a la base de conocimiento
    """
    try:
        # Verificar que el archivo existe
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"El archivo no existe: {pdf_path}")
        
        # Extraer texto del PDF
        logger.info(f"Extrayendo texto de {pdf_path}")
        text = extract_text_from_pdf(pdf_path)
        
        # Guardar texto en archivo temporal
        txt_path = pdf_path.replace(".pdf", ".txt")
        save_text_to_file(text, txt_path)
        
        # Inicializar base de conocimiento
        chroma_dir = chroma_dir or "./chroma_db"
        knowledge_base = PolicyKnowledgeBase(persist_directory=chroma_dir)
        
        # Agregar documento a la base de conocimiento
        logger.info(f"Agregando documento a la base de conocimiento: {policy_id} - {policy_name}")
        chunks_added = knowledge_base.add_document(txt_path, policy_id, policy_name)
        
        logger.info(f"Documento procesado correctamente: {chunks_added} chunks agregados")
        return chunks_added
    except Exception as e:
        logger.error(f"Error al procesar documento: {str(e)}")
        raise

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Procesa un documento de política de crédito y lo carga en la base de conocimiento')
    parser.add_argument('pdf_path', help='Ruta al archivo PDF')
    parser.add_argument('policy_id', help='ID de la política')
    parser.add_argument('policy_name', help='Nombre de la política')
    parser.add_argument('--chroma-dir', help='Directorio de la base de datos ChromaDB', default='./chroma_db')
    
    args = parser.parse_args()
    
    try:
        chunks_added = process_policy_document(
            pdf_path=args.pdf_path,
            policy_id=args.policy_id,
            policy_name=args.policy_name,
            chroma_dir=args.chroma_dir
        )
        print(f"Documento procesado correctamente: {chunks_added} chunks agregados")
        return 0
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())