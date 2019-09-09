from django import forms
import neomodel
from dal import autocomplete

import sys
from .models import Category, Notes
"""
class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['category']
"""
class CategoryForm(forms.Form):
    category = forms.CharField(max_length=80)

"""
class SearchNotesForm(forms.ModelForm):
    class Meta:
        model = Notes
        fields = ['note_title']
        widgets = {
            'title':forms.TextInput(attrs={'size':40})
        }
"""

class SearchNotesForm(forms.Form):
    note_title = forms.CharField(label='Title', max_length=80, widget=forms.TextInput)

"""
class NoteEditingForm(forms.ModelForm):
    class Meta:
        model = Notes
        fields = ['note_content']
        widgets = {
            'note_content':forms.Textarea(attrs={'cols':80, 'rows':20})
        }
        """

class NoteEditingForm(forms.Form):
    note_title = forms.CharField(max_length=80)
    note_content = forms.CharField(max_length=1000)
    category = forms.CharField(max_length=80, widget = autocomplete.ListSelect2(url='notes:category_autocomplete'))

class CategoryForm(forms.Form):
    category_name = forms.CharField(label='category_name', max_length=80, widget=forms.TextInput)
    category_rel_feature = forms.CharField(max_length=80)
    #cateogory_relate_to = forms.CharField(max_length=80, widget = autocomplete.ListSelect2(url='notes:category_autocomplete'))

class CategorizeForm(forms.Form):
    selct_category = forms.CharField(max_length=80, widget = autocomplete.ListSelect2(url='notes:category_autocomplete'))
    serch_cateogry = forms.CharField(label='search' ,max_length=80, widget=forms.TextInput)