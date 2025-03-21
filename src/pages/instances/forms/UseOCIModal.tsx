import { FC } from "react";
import {
  ActionButton,
  Button,
  Form,
  Input,
  Modal,
} from "@canonical/react-components";
import { useFormik } from "formik";
import * as Yup from "yup";
import { LxdImageType, RemoteImage } from "types/image";

interface Props {
  close: () => void;
  onSelect: (image: RemoteImage, type?: LxdImageType) => void;
}

const UseOCIModal: FC<Props> = ({ close, onSelect }) => {
  const formik = useFormik({
    initialValues: {
      registry: "",
      image: "",
    },
    validationSchema: Yup.object().shape({
      registry: Yup.string().required("Registry is required"),
      image: Yup.string().required("Image is required"),
    }),
    onSubmit: (values) =>
      onSelect(
        {
          arch: "",
          created_at: new Date().getTime(),
          os: "",
          release: "",
          aliases: values.image,
          server: values.registry,
          protocol: "oci",
        },
        "container",
      ),
  });

  const handleCloseModal = () => {
    close();
  };

  return (
    <Modal close={close} className="use-oci-modal" title="Use OCI">
      <Form onSubmit={formik.handleSubmit}>
        <Input
          {...formik.getFieldProps("registry")}
          id="registry"
          type="text"
          label="Registry"
          placeholder="Enter registry URL"
          error={formik.touched.registry ? formik.errors.registry : null}
        />
        <Input
          {...formik.getFieldProps("image")}
          id="image"
          type="text"
          label="Image"
          placeholder="Enter image name"
          error={formik.touched.image ? formik.errors.image : null}
        />
      </Form>
      <footer className="p-modal__footer" id="modal-footer">
        <Button
          appearance="base"
          className="u-no-margin--bottom"
          type="button"
          onClick={handleCloseModal}
        >
          Cancel
        </Button>
        <ActionButton
          appearance="positive"
          className="u-no-margin--bottom"
          loading={formik.isSubmitting}
          disabled={!formik.isValid}
          onClick={() => void formik.submitForm()}
        >
          Confirm
        </ActionButton>
      </footer>
    </Modal>
  );
};

export default UseOCIModal;
