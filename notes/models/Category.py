import django_neomodel, neomodel
from neomodel import StructuredNode, StringProperty, Relationship, DateTimeProperty, config, StructuredRel, UniqueIdProperty, BooleanProperty
from django_neomodel import DjangoNode 
from django.db import models

# モデルのなかでrel使うので先に宣言する
class CategoryRel(StructuredRel):
    features = StringProperty(max_length=50)



class Categories(StructuredNode):
    category_name = StringProperty(unique=True)
    parent_category = neomodel.RelationshipFrom('Categories', 'parent_catefory', model=CategoryRel)
    category_kind = StringProperty(max_length=50)
    reflexive = BooleanProperty(required = True)
    

    def __str__(self):
        return "{}".format(self.category_name)

    class Meta:
        app_label = 'notes'

