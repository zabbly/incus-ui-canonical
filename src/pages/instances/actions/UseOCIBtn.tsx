import { FC } from "react";
import { Button, usePortal } from "@canonical/react-components";
import UseOCIModal from "../forms/UseOCIModal";
import { LxdImageType, RemoteImage } from "types/image";

interface Props {
  onSelect: (image: RemoteImage, type?: LxdImageType) => void;
}

const UseOCIBtn: FC<Props> = ({ onSelect }) => {
  const { openPortal, closePortal, isOpen, Portal } = usePortal();

  const handleSelect = (image: RemoteImage, type?: LxdImageType) => {
    closePortal();
    onSelect(image, type);
  };

  return (
    <>
      <Button onClick={openPortal} type="button">
        <span>Use OCI</span>
      </Button>
      {isOpen && (
        <Portal>
          <UseOCIModal close={closePortal} onSelect={handleSelect} />
        </Portal>
      )}
    </>
  );
};

export default UseOCIBtn;
