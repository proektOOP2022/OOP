import torchvision
import os
from transformers import DetrFeatureExtractor
from PIL import Image
import pytorch_lightning as pl
from transformers import DetrConfig, DetrForObjectDetection
import torch

class CocoDetection(torchvision.datasets.CocoDetection):
    def __init__(self, img_folder, feature_extractor, train=True):
        ann_file = os.path.join(img_folder, "_annotations.coco.json" if train else "_annotations.coco.json")
        super(CocoDetection, self).__init__(img_folder, ann_file)
        self.feature_extractor = feature_extractor

    def __getitem__(self, idx):
        # read in PIL image and target in COCO format
        img, target = super(CocoDetection, self).__getitem__(idx)

        # preprocess image and target (converting target to DETR format, resizing + normalization of both image and target)

        image_id = self.ids[idx]
        target = {'image_id': image_id, 'annotations': target}
        encoding = self.feature_extractor(images=img, annotations=target, return_tensors="pt")
        pixel_values = encoding["pixel_values"].squeeze()  # remove batch dimension
        target = encoding["labels"][0]  # remove batch dimension

        return pixel_values, target

def collate_fn(batch):
  pixel_values = [item[0] for item in batch]
  encoding = feature_extractor.pad_and_create_pixel_mask(pixel_values, return_tensors="pt")
  labels = [item[1] for item in batch]
  batch = {}
  batch['pixel_values'] = encoding['pixel_values']
  batch['pixel_mask'] = encoding['pixel_mask']
  batch['labels'] = labels
  return batch

class Detr(pl.LightningModule):

    def __init__(self, lr = 1e-4, lr_backbone = 1e-5, weight_decay = 1e-4):
        super().__init__()
        # замените head классификации COCO на кастомную
        self.model = DetrForObjectDetection.from_pretrained("facebook/detr-resnet-50",
                                                            num_labels=len(id2label),
                                                            ignore_mismatched_sizes=True)
        self.lr = lr
        self.lr_backbone = lr_backbone
        self.weight_decay = weight_decay


    def forward(self, pixel_values, pixel_mask):
        outputs = self.model(pixel_values=pixel_values, pixel_mask=pixel_mask)

        return outputs

    def common_step(self, batch, batch_idx):
        pixel_values = batch["pixel_values"]
        pixel_mask = batch["pixel_mask"]
        labels = [{k: v.to(self.device) for k, v in t.items()} for t in batch["labels"]]

        outputs = self.model(pixel_values=pixel_values, pixel_mask=pixel_mask, labels=labels)

        loss = outputs.loss
        loss_dict = outputs.loss_dict

        return loss, loss_dict

    def training_step(self, batch, batch_idx):
        loss, loss_dict = self.common_step(batch, batch_idx)
        # logs metrics for each training_step,
        # and the average across the epoch
        self.log("training_loss", loss)
        for k, v in loss_dict.items():
            self.log("train_" + k, v.item())

        return loss

    def validation_step(self, batch, batch_idx):
        loss, loss_dict = self.common_step(batch, batch_idx)
        self.log("validation_loss", loss)
        for k, v in loss_dict.items():
            self.log("validation_" + k, v.item())

        return loss

    def configure_optimizers(self):
        param_dicts = [
            {"params": [p for n, p in self.named_parameters() if "backbone" not in n and p.requires_grad]},
            {
                "params": [p for n, p in self.named_parameters() if "backbone" in n and p.requires_grad],
                "lr": self.lr_backbone,
            },
        ]
        optimizer = torch.optim.AdamW(param_dicts, lr=self.lr,
                                      weight_decay=self.weight_decay)

        return optimizer


id2label = {0: 'potholes', 1: 'pothole'}


model = Detr.load_from_checkpoint("lightning_logs/version_1/checkpoints/epoch=180-step=204167.ckpt",lr_backbone=1e-5, weight_decay=1e-4)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model.to(device)
model.eval()

def visualize_predictions(image, outputs, threshold=0.9):
    import torch

    # keep only predictions of queries with 0.9+ confidence (excluding no-object class)
    probas = outputs.logits.softmax(-1)[0, :, :-1]
    keep = 0.3>probas.max(-1).values

    # rescale bounding boxes
    target_sizes = torch.tensor(image.size[::-1]).unsqueeze(0)
    postprocessed_outputs = feature_extractor.post_process(outputs, target_sizes)
    bboxes_scaled = postprocessed_outputs[0]['boxes'][keep]

    # plot_results(image, probas[keep], bboxes_scaled[:10])
    return bboxes_scaled


os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"

def quality(bbox):
    a = 10
    b = 150
    res = len(bbox)
    d = res - a
    return round(d/(b-a),3)




import json
with open("img/annotations.json") as file:
    annotations = json.load(file)
images = annotations['images']
ans = []
for el in images:

    im = el['file_name']
    image = Image.open(f'img/{im}')

    feature_extractor = DetrFeatureExtractor.from_pretrained("facebook/detr-resnet-50")
    encoding = feature_extractor(image, return_tensors="pt")
    pixel_values = encoding['pixel_values']
    pixel_values.unsqueeze(0).to(device)
    outputs = model(pixel_values=pixel_values, pixel_mask=None)
    q = quality(visualize_predictions(image, outputs))
    ans.append(q)
result = {
    "quality" : ans
}

with open("quality.json", "w") as file:
    json.dump(result,file)
