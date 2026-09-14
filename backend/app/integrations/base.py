from abc import ABC, abstractmethod

from app.schemas.erp import ERPPayload, ERPReceipt


class ConnectorError(Exception):
    def __init__(self, message, http_status=None):
        self.message = message
        self.http_status = http_status


class ERPConnector(ABC):
    @abstractmethod
    def send(self, payload: ERPPayload, scenario: str) -> ERPReceipt:
        raise NotImplementedError
