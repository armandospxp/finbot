import os
import logging
from typing import List, Dict, Any, Optional
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader, TextLoader
from langchain.schema import Document
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PolicyKnowledgeBase:
    def __init__(self, persist_directory: str = "./chroma_db", embedding_model: str = "text-embedding-ada-002"):
        """Inicializa la base de conocimiento de políticas
        
        Args:
            persist_directory: Directorio donde se almacenará la base de datos vectorial
            embedding_model: Modelo de embeddings a utilizar
        """
        self.persist_directory = persist_directory
        self.embedding_model = embedding_model
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        # Crear directorio si no existe
        os.makedirs(persist_directory, exist_ok=True)
        
        # Inicializar embeddings
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.openai_api_key)
        
        # Inicializar vectorstore
        self._initialize_vectorstore()
    
    def _initialize_vectorstore(self):
        """Inicializa o carga la base de datos vectorial"""
        try:
            # Intentar cargar la base de datos existente
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )
            logger.info(f"Base de conocimiento cargada desde {self.persist_directory}")
        except Exception as e:
            logger.warning(f"No se pudo cargar la base de conocimiento existente: {str(e)}")
            # Crear una nueva base de datos
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )
            logger.info(f"Nueva base de conocimiento creada en {self.persist_directory}")
    
    def add_document(self, file_path: str, policy_id: str, policy_name: str) -> int:
        """Agrega un documento a la base de conocimiento
        
        Args:
            file_path: Ruta al archivo (PDF o TXT)
            policy_id: ID de la política
            policy_name: Nombre de la política
            
        Returns:
            Número de chunks agregados
        """
        try:
            # Cargar el documento según su extensión
            if file_path.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
            elif file_path.endswith(".txt"):
                loader = TextLoader(file_path)
            else:
                raise ValueError(f"Formato de archivo no soportado: {file_path}")
            
            documents = loader.load()
            
            # Agregar metadatos
            for doc in documents:
                doc.metadata["policy_id"] = policy_id
                doc.metadata["policy_name"] = policy_name
                doc.metadata["source"] = file_path
            
            # Dividir el documento en chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
            )
            chunks = text_splitter.split_documents(documents)
            
            # Agregar chunks a la base de conocimiento
            self.vectorstore.add_documents(chunks)
            
            # Persistir cambios
            self.vectorstore.persist()
            
            logger.info(f"Documento agregado a la base de conocimiento: {file_path} ({len(chunks)} chunks)")
            return len(chunks)
        except Exception as e:
            logger.error(f"Error al agregar documento a la base de conocimiento: {str(e)}")
            raise
    
    def search(self, query: str, k: int = 5, filter: Optional[Dict[str, Any]] = None) -> List[Document]:
        """Busca documentos relevantes en la base de conocimiento
        
        Args:
            query: Consulta de búsqueda
            k: Número de resultados a devolver
            filter: Filtro para la búsqueda (ej: {"policy_id": "123"})
            
        Returns:
            Lista de documentos relevantes
        """
        try:
            results = self.vectorstore.similarity_search(
                query=query,
                k=k,
                filter=filter
            )
            return results
        except Exception as e:
            logger.error(f"Error al buscar en la base de conocimiento: {str(e)}")
            return []
    
    def delete_policy(self, policy_id: str) -> bool:
        """Elimina una política de la base de conocimiento
        
        Args:
            policy_id: ID de la política a eliminar
            
        Returns:
            True si se eliminó correctamente, False en caso contrario
        """
        try:
            # Obtener los IDs de los documentos con el policy_id especificado
            filter = {"policy_id": policy_id}
            results = self.vectorstore.similarity_search(
                query="",  # Query vacía para obtener todos los documentos
                k=1000,  # Número alto para obtener todos los documentos
                filter=filter
            )
            
            # Extraer los IDs de los documentos
            doc_ids = [doc.metadata.get("id") for doc in results if "id" in doc.metadata]
            
            # Eliminar los documentos
            if doc_ids:
                self.vectorstore.delete(doc_ids)
                self.vectorstore.persist()
                logger.info(f"Política eliminada de la base de conocimiento: {policy_id} ({len(doc_ids)} documentos)")
                return True
            else:
                logger.warning(f"No se encontraron documentos para la política: {policy_id}")
                return False
        except Exception as e:
            logger.error(f"Error al eliminar política de la base de conocimiento: {str(e)}")
            return False
    
    def get_policy_content(self, policy_id: str, max_chunks: int = 10) -> str:
        """Obtiene el contenido de una política
        
        Args:
            policy_id: ID de la política
            max_chunks: Número máximo de chunks a devolver
            
        Returns:
            Contenido de la política
        """
        try:
            # Buscar documentos de la política
            filter = {"policy_id": policy_id}
            results = self.vectorstore.similarity_search(
                query="",  # Query vacía para obtener todos los documentos
                k=max_chunks,
                filter=filter
            )
            
            # Concatenar el contenido de los documentos
            content = "\n\n".join([doc.page_content for doc in results])
            return content
        except Exception as e:
            logger.error(f"Error al obtener contenido de la política: {str(e)}")
            return ""