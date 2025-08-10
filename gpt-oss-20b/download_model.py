import os
import argparse
import logging
from transformers import AutoModelForCausalLM, AutoTokenizer

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def download_model(model_name, output_dir, use_4bit=True):
    """
    Descarga un modelo de HuggingFace y lo guarda en el directorio especificado.
    
    Args:
        model_name (str): Nombre del modelo en HuggingFace Hub
        output_dir (str): Directorio donde guardar el modelo
        use_4bit (bool): Si se debe usar cuantización de 4 bits
    """
    try:
        logger.info(f"Descargando modelo {model_name}...")
        
        # Crear directorio si no existe
        os.makedirs(output_dir, exist_ok=True)
        
        # Descargar tokenizer
        logger.info("Descargando tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.save_pretrained(output_dir)
        logger.info(f"Tokenizer guardado en {output_dir}")
        
        # Descargar modelo
        logger.info("Descargando modelo...")
        if use_4bit:
            logger.info("Usando cuantización de 4 bits para reducir el uso de memoria")
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                device_map="auto",
                load_in_4bit=True
            )
        else:
            model = AutoModelForCausalLM.from_pretrained(model_name)
        
        model.save_pretrained(output_dir)
        logger.info(f"Modelo guardado en {output_dir}")
        
        return True
    except Exception as e:
        logger.error(f"Error al descargar el modelo: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Descargar modelo de lenguaje para gpt-oss-20b')
    parser.add_argument('--model', type=str, default="mistralai/Mistral-7B-Instruct-v0.2", 
                        help='Nombre del modelo en HuggingFace Hub')
    parser.add_argument('--output', type=str, default="./models/gpt-oss-20b", 
                        help='Directorio donde guardar el modelo')
    parser.add_argument('--no-4bit', action='store_true', 
                        help='Desactivar cuantización de 4 bits')
    
    args = parser.parse_args()
    
    logger.info(f"Iniciando descarga del modelo {args.model} en {args.output}")
    success = download_model(args.model, args.output, not args.no_4bit)
    
    if success:
        logger.info("Descarga completada exitosamente")
    else:
        logger.error("La descarga falló")

if __name__ == "__main__":
    main()