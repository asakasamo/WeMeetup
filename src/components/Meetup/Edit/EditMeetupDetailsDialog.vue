<template>
   <v-dialog width="350px" persistent v-model="editDialog">

      <!-- Activator button -->
      <v-btn fab accent small slot="activator">
         <v-icon>edit</v-icon>
      </v-btn>

      <!-- Main card wrapper -->
      <v-card>
         <v-container>

            <!-- Dialog box title -->
            <!-- v-layout row wrap>
               <v-flex xs12>
                  <v-card-title>Edit Meetup</v-card-title>
               </v-flex>
            </v-layout -->

            <!-- Inputs wrapper -->
            <v-layout row wrap>
               <v-flex xs12>
                  <v-card-text>
                     
                     <!-- Edit title -->
                     <v-text-field 
                        name="title" 
                        label="Title" 
                        id="title"
                        required
                        v-model="editedTitle"
                        >
                     </v-text-field>

                     <!-- Edit Location -->
                     <v-text-field 
                        name="location" 
                        label="Location" 
                        id="location"
                        required
                        v-model="editedLocation"
                        >
                     </v-text-field>
                     
                     <!-- Edit description -->
                     <v-textarea
                        name="description" 
                        label="Description" 
                        id="description"
                        required
                        v-model="editedDescription"
                        >
                     </v-textarea>

                  </v-card-text>
               </v-flex>
            </v-layout>

            <v-divider></v-divider>

            <!-- Action buttons -->
            <v-layout row wrap>
               <v-flex xs12>
                  <v-card-actions>

                     <!-- Save button -->
                     <v-btn 
                        flat 
                        class="success" 
                        @click="onSaveChanges"
                        >
                        Save
                     </v-btn>
                     
                     <v-spacer></v-spacer>
                     
                     <!-- Close button -->
                     <v-btn 
                        flat 
                        class="error" 
                        @click="editDialog = false"
                        >
                        Close
                     </v-btn>

                  </v-card-actions>
               </v-flex>
            </v-layout>
         </v-container>
      </v-card>
   </v-dialog>
</template>

<script>
export default {
   props: ["meetup"],
   data() {
      return {
         editDialog: false,
         editedTitle: this.meetup.title,
         editedDescription: this.meetup.description,
         editedLocation: this.meetup.location
      };
   },
   methods: {
      onSaveChanges() {
         if (
            !this.editedTitle.trim() ||
            !this.editedDescription.trim() ||
            !this.editedLocation.trim()
         ) {
            return;
         }

         this.editDialog = false;
         this.$store.dispatch("updateMeetupData", {
            id: this.meetup.id,
            title: this.editedTitle,
            location: this.editedLocation,
            description: this.editedDescription
         });
      }
   }
};
</script>