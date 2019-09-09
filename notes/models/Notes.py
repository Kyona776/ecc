import django_neomodel, neomodel
from neomodel import StructuredNode, StringProperty, Relationship, DateTimeProperty, config, UniqueIdProperty, StructuredRel
try:
    from Category import Categories
except:
    from .Category import Categories


class NotesRel(StructuredRel):
    comment = StringProperty(max_length=200)

class Notes(StructuredNode):
    uid = UniqueIdProperty()
    note_title = StringProperty(max_length=80)
    note_content = StringProperty()
    categories = Relationship('.Category.Categories', 'note_of_category', model=NotesRel)
    pub_date = DateTimeProperty(default_now=True)
    update_at = DateTimeProperty(default_now=True)

    def __str__(self):
        return "{}(id:{})".format(self.note_title, self.uid)

    class Meta:
        app_label = 'notes'